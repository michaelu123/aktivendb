<template>
    <v-app-bar app>
        <v-toolbar-title class="headline mr-2">
        <span class="font-weight-light">Aktivenverwaltung ADFC München</span>
        </v-toolbar-title>
        <v-toolbar-items>
            <v-btn text to="/">
                Home
            </v-btn>
            <v-btn text to="/members"  v-if="logged_in">
                Aktive
            </v-btn>
            <v-btn text to="/project_teams"  v-if="logged_in">
                AGs
            </v-btn>
        </v-toolbar-items>
        <div class="flex-grow-1"></div>
        <v-toolbar-items>
            <v-btn text to="/login"  v-if="!logged_in">
                <span class="font-weight-light">Login</span>
            </v-btn>
            <v-btn text to="/logout"  v-if="logged_in">
                <span class="font-weight-light">Logout</span>
            </v-btn>
        </v-toolbar-items>
    </v-app-bar>
</template>

<script>
    export default {
      name: "Navigation",
      computed:
        {
          logged_in: function()
          {
            return this.$store.state.is_logged_in;
          }
        }
    }
</script>

<style scoped>

</style>