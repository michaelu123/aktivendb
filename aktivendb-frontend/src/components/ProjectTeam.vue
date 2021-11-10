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
      :items="projectTeams"
      :search="search"
      :loading="loading"
      loading-text="Wird geladen..."
      @click:row="viewItem"
    >
      <template v-slot:top>
        <AddTeamToTeamsDialog
          :editWindow="editWindow"
          :editedItem="editedItem"
          :memberRoles="memberRoles"
          :members="members"
          :allMembers="allMembers"
          :strictReadonly="strictReadonly"
          :searchEditWindow="searchEditWindow"
          :checkForTrue="checkForTrue"
          :closeEditProjectTeamMemberWindow="closeEditProjectTeamMemberWindow"
          :handleRequestError="handleRequestError"
          @closeEW="closeEditWindow"
          @saveEW="saveEditWindow"
        ></AddTeamToTeamsDialog>
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
      <template v-slot:item.needs_first_aid_training="{ item }">
        <v-simple-checkbox
          :value="checkForTrue(item.needs_first_aid_training)"
          disabled
        >
        </v-simple-checkbox>
      </template>
    </v-data-table>
  </v-card>
</template>

<script>
import AddTeamToTeamsDialog from "./AddTeamToTeamsDialog.vue";
export default {
  components: { AddTeamToTeamsDialog },
  name: "ProjectTeam",
  data() {
    return {
      search: "",
      strictReadonly: false,
      searchEditWindow: "",
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
        memberList: {
          headers: [
            {
              text: "Actions",
              value: "action",
              sortable: false,
              filterable: false,
            },
            {
              text: "Aktive(r)",
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
          text: "Name",
          value: "name",
        },
        {
          text: "E-Mail",
          value: "email",
        },
        {
          text: "1. Hilfe",
          value: "needs_first_aid_training",
          filterable: false,
        },
      ],
      editedIndex: -1,
      projectTeams: [],
      allMembers: [],
      members: [],
      editedItem: {
        id: -1,
        name: "",
        email: "",
        needs_first_aid_training: false,
        description: "",
        comments: "",
        members: [],
      },
      defaultItem: {
        id: -1,
        name: "",
        email: "",
        needs_first_aid_training: false,
        description: "",
        comments: "",
        members: [],
      },
      memberRoles: [],
    };
  },
  watch: {
    "editWindow.shown": {
      deep: true,
      handler: function (val) {
        val || this.closeEditWindow();
      },
    },
    "editWindow.memberList.editProjectTeamMemberWindow.shown": {
      deep: true,
      handler: function (val) {
        val || this.closeEditProjectTeamMemberWindow();
      },
    },
    "editedItem.members": {
      deep: true,
      handler: function (val) {
        this.members = val;
      },
    },
  },
  mounted() {
    this.strictReadonly = sessionStorage.getItem("readonly") == 1;
    this.getAllMembersFromApi().then((data) => {
      let res = data.items;
      for (let member of res) {
        member.name = member.last_name.trim() + ", " + member.first_name.trim();
      }
      res.sort((a, b) => (a.name < b.name ? -1 : a.name == b.name ? 0 : 1));
      this.allMembers = res;
    });
    this.getMemberRolesFromApi().then((data) => {
      this.memberRoles = data.items;
    });
    this.getAllProjectTeamsFromApi().then((data) => {
      let res1 = data.items;
      let res2 = [];
      for (let team of res1) {
        if (team.with_details) {
          res2.push(team);
        }
      }
      res2.sort((a, b) => (a.name < b.name ? -1 : a.name == b.name ? 0 : 1));
      this.projectTeams = res2;
    });
  },
  methods: {
    handleRequestError(error, scope) {
      this.is_logged_in = false;
      if (error.response) {
        console.log("error5", error.response);
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
    getAllProjectTeamsFromApi() {
      var me = this;
      me.loading = true;

      return new Promise((resolve, reject) => {
        let items = [];

        this.$http
          .get("/api/project-teams?token=" + sessionStorage.getItem("token"))
          .then(function (response) {
            me.loading = false;
            items = response.data;

            resolve({ items });
          })
          .catch(function (error) {
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
          .then(function (response) {
            items = response.data;

            resolve({ items });
          })
          .catch(function (error) {
            me.handleRequestError(error);
            reject("Error");
          });
      });
    },
    getAllMembersFromApi() {
      return new Promise((resolve, reject) => {
        var me = this;

        let items = [];

        this.$http
          .get("/api/members?token=" + sessionStorage.getItem("token"))
          .then(function (response) {
            items = response.data;

            resolve({ items });
          })
          .catch(function (error) {
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
      this.editedIndex = this.projectTeams.indexOf(item);
      this.editWindow.loading = true;
      var projectTeamId = this.projectTeams[this.editedIndex].id;
      var me = this;

      this.$http
        .get(
          "/api/project-team/" +
            projectTeamId +
            "?token=" +
            sessionStorage.getItem("token")
        )
        .then(function (response) {
          me.editWindow.loading = false;
          Object.assign(me.projectTeams[me.editedIndex], response.data);
          me.editedItem = Object.assign(item, response.data);
          for (let member of me.editedItem.members) {
            member.name =
              member.last_name.trim() + ", " + member.first_name.trim();
          }
          me.editedItem.members.sort((a, b) =>
            a.name < b.name ? -1 : a.name == b.name ? 0 : 1
          );
        })
        .catch(function (error) {
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
      var index = this.projectTeams.indexOf(item);
      var me = this;

      if (confirm("Are you sure you want to delete this item?")) {
        var projectTeamId = this.projectTeams[index].id;
        this.$http
          .delete(
            "/api/project-team/" +
              projectTeamId +
              "?token=" +
              sessionStorage.getItem("token")
          )
          .then(function (_) {
            me.projectTeams.splice(index, 1);

            me.showAlert("success", "Gelöscht");
          })
          .catch(function (error) {
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
      this.editWindow.memberList.editProjectTeamMemberWindow.saveInProgress = false;
      this.editWindow.memberList.editProjectTeamMemberWindow.shown = false;
      this.editWindow.memberList.editProjectTeamMemberWindow.readonly = false;
      setTimeout(() => {
        this.editedProjectTeamMember = Object.assign(
          {},
          this.editWindow.memberList.defaultProjectTeamMember
        );
        this.editWindow.memberList.editProjectTeamMemberWindow.errors = {};
        this.editedProjectTeamMemberIndex = -1;
      }, 300);
    },
    saveEditWindow() {
      this.editWindow.saveInProgress = true;
      var me = this;

      if (this.editedIndex > -1) {
        var projectTeamId = this.editedItem.id;
        this.$http
          .put(
            "/api/project-team/" +
              projectTeamId +
              "?token=" +
              sessionStorage.getItem("token"),
            this.editedItem
          )
          .then(function (response) {
            Object.assign(me.projectTeams[me.editedIndex], response.data);
            me.closeEditWindow();

            me.showAlert("success", "Gespeichert");
          })
          .catch(function (error) {
            me.handleRequestError(error, me.editWindow);
          });
      } else {
        this.$http
          .post(
            "/api/project-team?token=" + sessionStorage.getItem("token"),
            this.editedItem
          )
          .then(function (response) {
            me.projectTeams.push(response.data);
            me.closeEditWindow();

            me.showAlert("success", "Gespeichert");
          })
          .catch(function (error) {
            me.handleRequestError(error, me.editWindow);
          });
      }
    },
  },
};
</script>
