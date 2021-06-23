<template>
  <v-card>
    <v-card-title>
      <div>
        <v-alert
          :type="alert.type"
          outlined
          v-model="alert.shown"
          dismissible
          width="100%"
        >
          {{ alert.text }}
        </v-alert>
      </div>
    </v-card-title>
    <v-data-table
      :headers="headers"
      :items="members"
      :search="search"
      :loading="loading"
      loading-text="Wird geladen..."
      @click:row="viewItem"
    >
      <template v-slot:top>
        <AddMemberToMembersDialog
          :editWindow="editWindow"
          :editedItem="editedItem"
          :memberRoles="memberRoles"
          :projectTeams="projectTeams"
          :allProjectTeams="allProjectTeams"
          :strictReadonly="strictReadonly"
          :searchEditWindow="searchEditWindow"
          :checkForTrue="checkForTrue"
          :closeEditProjectTeamMemberWindow="closeEditProjectTeamMemberWindow"
          :handleRequestError="handleRequestError"
          @closeEW="closeEditWindow"
          @saveEW="saveEditWindow"
        ></AddMemberToMembersDialog>
        <v-spacer></v-spacer>
        <v-switch v-model="activeSwitch" label="Nur Aktive"> </v-switch>
        <v-spacer></v-spacer>
        <v-text-field
          v-model="search"
          label="Suchen"
          append-icon="search"
          single-line
          hide-details
        ></v-text-field>
      </template>
      <template v-slot:item.action="{ item }">
        <v-icon
          small
          class="mr-2"
          @click.stop="editItem(item)"
          v-if="!strictReadonly"
        >
          edit
        </v-icon>
        <v-icon small @click.stop="deleteItem(item)" v-if="!strictReadonly">
          delete
        </v-icon>
      </template>
      <template v-slot:item.active="{ item }">
        <v-avatar color="green" size="24" v-if="checkForTrue(item.active)">
          <v-icon small dense class="white--text">
            mdi-checkbox-marked-circle-outline
          </v-icon>
        </v-avatar>
        <v-avatar color="red" size="24" v-if="!checkForTrue(item.active)">
          <v-icon small dense class="white--text">
            mdi-checkbox-blank-circle-outline
          </v-icon>
        </v-avatar>
      </template>
    </v-data-table>
  </v-card>
</template>

<script>
import AddMemberToMembersDialog from "./AddMemberToMembersDialog.vue";
export default {
  components: { AddMemberToMembersDialog },
  name: "Member",
  data() {
    return {
      search: "",
      strictReadonly: false,
      searchEditWindow: "",
      activeSwitch: true,
      loading: true,
      editWindow: {
        loading: false,
        shown: false,
        readonly: false,
        formValid: true,
        saveInProgress: false,
        errors: {},
        showLatestContactDatePicker: false,
        showLatestFirstAidTrainingDatePicker: false,
        teamList: {
          headers: [
            {
              text: "Actions",
              value: "action",
              sortable: false,
              filterable: false,
            },
            {
              text: "AG",
              value: "name",
            },
            {
              text: "Funktion",
              value: "project_team_member.member_role_title",
            },
          ],
          editProjectTeamMemberWindow: {
            shown: false,
            readonly: false,
            formValid: true,
            saveInProgress: false,
            errors: {},
          },
          editedProjectTeamMemberIndex: -1,
          editedProjectTeamMember: {
            project_team_member: {
              admin_comments: "",
              id: -1,
              member_id: -1,
              member_role_id: -1,
              member_role_title: "",
              project_team_id: -1,
            },
            name: "",
          },
          defaultProjectTeamMember: {
            project_team_member: {
              admin_comments: "",
              id: -1,
              member_id: -1,
              member_role_id: -1,
              member_role_title: "",
              project_team_id: -1,
            },
            name: "",
          },
        },
      },
      alert: {
        shown: false,
        text: "",
        type: "success",
      },
      headers: [
        {
          text: "Actions",
          value: "action",
          sortable: false,
          filterable: false,
        },
        {
          text: "Aktiv",
          value: "active",
          filter: (value) => {
            if (!this.activeSwitch) return true;

            return this.checkForTrue(value);
          },
        },
        {
          text: "Name",
          value: "name",
        },
        {
          text: "E-Mail (Privat)",
          value: "email_private",
        },
        {
          text: "E-Mail (ADFC)",
          value: "email_adfc",
        },
        {
          text: "Telefon",
          value: "phone_primary",
        },
        {
          text: "Letzter Kontakt",
          value: "latest_contact",
        },
        {
          text: "Letzte 1. Hilfe Schulung",
          value: "latest_first_aid_training",
        },
      ],
      editedIndex: -1,
      members: [],
      allProjectTeams: [],
      projectTeams: [],
      editedItem: {
        id: -1,
        name: "",
        email_adfc: "",
        email_private: "",
        phone_primary: "",
        phone_secondary: "",
        address: "",
        adfc_id: "0",
        admin_comments: "",
        reference: "",
        latest_first_aid_training: null,
        gender: "",
        interests: "",
        latest_contact: null,
        active: 1,
        user: null,
        project_teams: [],
      },
      defaultItem: {
        id: -1,
        name: "",
        email_adfc: "",
        email_private: "",
        phone_primary: "",
        phone_secondary: "",
        address: "",
        adfc_id: "0",
        admin_comments: "",
        reference: "",
        latest_first_aid_training: null,
        gender: "",
        interests: "",
        latest_contact: null,
        active: 1,
        user: null,
        project_teams: [],
      },
      memberRoles: [],
    };
  },
  watch: {
    "editWindow.shown": {
      deep: true,
      handler: function(val) {
        val || this.closeEditWindow();
      },
    },
    "editWindow.teamList.editProjectTeamMemberWindow.shown": {
      deep: true,
      handler: function(val) {
        val || this.closeEditProjectTeamMemberWindow();
      },
    },
    "editedItem.project_teams": {
      deep: true,
      handler: function(val) {
        if (!val) val = [];
        this.projectTeams = val;
      },
    },
  },
  mounted() {
    this.strictReadonly = sessionStorage.getItem("readonly") == 1;
    this.getMembersFromApi().then((data) => {
      this.members = data.items;
    });
    this.getMemberRolesFromApi().then((data) => {
      this.memberRoles = data.items;
    });
    this.getAllProjectTeamsFromApi().then((data) => {
      this.allProjectTeams = data.items;
    });
  },
  methods: {
    handleRequestError(error, scope) {
      console.log("hre!!!");
      this.is_logged_in = false;
      if (error.response) {
        console.log(error.response);
        switch (error.response.status) {
          case 401:
            this.$router.push("login");
            break;
          case 422:
            scope.saveInProgress = false;
            scope.errors = error.response.data;
            break;
          default:
            this.showAlert("error", "Unbekannter Fehler");
        }
      } else if (error.request) {
        this.$router.push("login");
      } else {
        this.$router.push("login");
      }
    },
    checkForTrue(val) {
      if (val === true || val == "1" || val == 1) {
        return true;
      } else {
        return false;
      }
    },
    getMembersFromApi() {
      var me = this;
      me.loading = true;

      return new Promise((resolve, reject) => {
        let items = [];

        this.$http
          .get("/api/members?token=" + sessionStorage.getItem("token"))
          .then(function(response) {
            me.loading = false;
            items = response.data;

            resolve({ items });
          })
          .catch(function(error) {
            me.handleRequestError(error);
            reject("Error");
          });
      });
    },
    getMemberRolesFromApi() {
      return new Promise((resolve, reject) => {
        var me = this;
        let items = [];

        this.$http
          .get("/api/member-roles?token=" + sessionStorage.getItem("token"))
          .then(function(response) {
            items = response.data;

            resolve({ items });
          })
          .catch(function(error) {
            me.handleRequestError(error);
            reject("Error");
          });
      });
    },
    getAllProjectTeamsFromApi() {
      return new Promise((resolve, reject) => {
        var me = this;
        let items = [];

        this.$http
          .get("/api/project-teams?token=" + sessionStorage.getItem("token"))
          .then(function(response) {
            items = response.data;

            resolve({ items });
          })
          .catch(function(error) {
            me.handleRequestError(error);
            reject("Error");
          });
      });
    },
    showAlert(type, text) {
      this.alert.shown = true;
      this.alert.type = type;
      this.alert.text = text;

      setTimeout(() => {
        this.alert.shown = false;
      }, 5000);
    },
    showItem(item) {
      this.editedIndex = this.members.indexOf(item);
      this.editWindow.loading = true;
      var memberId = this.members[this.editedIndex].id;
      var me = this;

      this.$http
        .get(
          "/api/member/" +
            memberId +
            "?token=" +
            sessionStorage.getItem("token"),
        )
        .then(function(response) {
          me.editWindow.loading = false;
          Object.assign(me.members[me.editedIndex], response.data);
          me.editedItem = Object.assign(item, response.data);
        })
        .catch(function(error) {
          me.handleRequestError(error);
        });
      this.editWindow.shown = true;
    },
    viewItem(item) {
      this.showItem(item);
      this.editWindow.readonly = true;
    },
    editItem(item) {
      this.showItem(item);
      this.editWindow.readonly = this.strictReadonly || false;
    },
    deleteItem(item) {
      var index = this.members.indexOf(item);
      var me = this;

      if (confirm("Are you sure you want to delete this item?")) {
        var memberId = this.members[index].id;
        this.$http
          .delete(
            "/api/member/" +
              memberId +
              "?token=" +
              sessionStorage.getItem("token"),
          )
          .then(function(response) {
            me.members.splice(index, 1);

            me.showAlert("success", "Gelöscht");
          })
          .catch(function(error) {
            me.handleRequestError(error);
          });
      }
    },
    closeEditWindow() {
      this.editWindow.saveInProgress = false;
      this.editWindow.shown = false;
      this.editWindow.readonly = false;
      setTimeout(() => {
        this.editedItem = Object.assign({}, this.defaultItem);
        this.editWindow.errors = {};
        this.editedIndex = -1;
      }, 300);
    },
    closeEditProjectTeamMemberWindow() {
      this.editWindow.teamList.editProjectTeamMemberWindow.saveInProgress = false;
      this.editWindow.teamList.editProjectTeamMemberWindow.shown = false;
      this.editWindow.teamList.editProjectTeamMemberWindow.readonly = false;
      setTimeout(() => {
        this.editedProjectTeamMember = Object.assign(
          {},
          this.editWindow.teamList.defaultProjectTeamMember,
        );
        this.editWindow.teamList.editProjectTeamMemberWindow.errors = {};
        this.editedProjectTeamMemberIndex = -1;
      }, 300);
    },
    saveEditWindow() {
      this.editWindow.saveInProgress = true;
      var me = this;

      if (this.editedIndex > -1) {
        var memberId = this.editedItem.id;
        this.$http
          .put(
            "/api/member/" +
              memberId +
              "?token=" +
              sessionStorage.getItem("token"),
            this.editedItem,
          )
          .then(function(response) {
            Object.assign(me.members[me.editedIndex], response.data);
            me.closeEditWindow();

            me.showAlert("success", "Gespeichert");
          })
          .catch(function(error) {
            me.handleRequestError(error, me.editWindow);
          });
      } else {
        this.$http
          .post(
            "/api/member?token=" + sessionStorage.getItem("token"),
            this.editedItem,
          )
          .then(function(response) {
            me.members.push(response.data);
            me.closeEditWindow();

            me.showAlert("success", "Gespeichert");
          })
          .catch(function(error) {
            me.handleRequestError(error, me.editWindow);
          });
      }
    },

  },
};
</script>
