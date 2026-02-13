import Alpine from "alpinejs";
import CTFd from "./index";
import { getOption } from "./utils/graphs/echarts/scoreboard";
import { embed } from "./utils/graphs/echarts";

window.Alpine = Alpine;
window.CTFd = CTFd;

// Default scoreboard polling interval to every 5 minutes
const scoreboardUpdateInterval = window.scoreboardUpdateInterval || 300000;

Alpine.data("ScoreboardDetail", () => ({
  data: {},
  show: true,
  activeBracket: null,

  async update() {
    this.data = await CTFd.pages.scoreboard.getScoreboardDetail(10, this.activeBracket);

    let optionMerge = window.scoreboardChartOptions;
    let option = getOption(CTFd.config.userMode, this.data, optionMerge);

    embed(this.$refs.scoregraph, option);
    this.show = Object.keys(this.data).length > 0;
  },

  async init() {
    this.update();

    setInterval(() => {
      this.update();
    }, scoreboardUpdateInterval);
  },
}));

Alpine.data("ScoreboardList", () => ({
  standings: [],
  brackets: [],
  activeBracket: null,
  currentPage: 1,
  perPage: 50,

  get filteredStandings() {
    return this.standings.filter(i => this.activeBracket ? i.bracket_id == this.activeBracket : true);
  },

  get totalPages() {
    return Math.ceil(this.filteredStandings.length / this.perPage);
  },

  get paginatedStandings() {
    const start = (this.currentPage - 1) * this.perPage;
    const end = start + this.perPage;
    return this.filteredStandings.slice(start, end);
  },

  get startIndex() {
    return (this.currentPage - 1) * this.perPage;
  },

  get showingFrom() {
    return this.filteredStandings.length > 0 ? this.startIndex + 1 : 0;
  },

  get showingTo() {
    return Math.min(this.startIndex + this.perPage, this.filteredStandings.length);
  },

  goToPage(page) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  },

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  },

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  },

  async update() {
    this.brackets = await CTFd.pages.scoreboard.getBrackets(CTFd.config.userMode);
    this.standings = await CTFd.pages.scoreboard.getScoreboard();
  },

  async init() {
    this.$watch("activeBracket", value => {
      this.$dispatch("bracket-change", value);
      this.currentPage = 1; // Reset to first page when bracket changes
    });

    this.update();

    setInterval(() => {
      this.update();
    }, scoreboardUpdateInterval);
  },
}));

Alpine.start();
