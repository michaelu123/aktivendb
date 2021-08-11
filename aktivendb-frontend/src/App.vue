<template>
  <v-app>
    <Navigation />

    <v-content>
      <router-view />
    </v-content>
  </v-app>
</template>

<script>
// @ is an alias to /src
import Navigation from "@/components/Navigation.vue";

export default {
  components: {
    Navigation,
  },
  mounted: function () {
    this.is_logged_in = !(sessionStorage.getItem("token") === null);
    var me = this;

    if (this.is_logged_in) {
      this.$http
        .get("/api/user?token=" + sessionStorage.getItem("token"))
        .then(function (response) {
          console.log("user", response);
          var data = response.data;
          me.$store.commit("logged_in", data);
        })
        .catch(function (error) {
          me.handleRequestError(error);
        });
    } else {
      this.$router.push("login");
    }
  },
  methods: {
    handleRequestError(error) {
      this.is_logged_in = false;
      this.$router.push("login");
      if (error.response) {
        var data = error.response.data;
        console.log("error1", data);
      } else if (error.request) {
        console.log("error2", error.request);
      } else {
        console.log("error3", error);
      }
    },
  },
};
</script>
