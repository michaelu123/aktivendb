<template>
  <v-card>
    <v-card-title>
      <div>
        <v-alert :type="alert.type" outlined v-model="alert.shown" dismissible width="100%">
          {{ alert.text }}
        </v-alert>
      </div>
    </v-card-title>
    <v-data-table :headers="headers" :items="projectTeams" :search="search" :loading="loading"
      loading-text="Wird geladen..." @click:row="viewItem">
      <template v-slot:top>
        <AddTeamToTeamsDialog :editWindow="editWindow" :editedItem="editedItem" :memberRoles="memberRoles"
          :members="members" :allMembers="allMembers" :strictReadonly="strictReadonly"
          :searchEditWindow="searchEditWindow" :checkForTrue="checkForTrue"
          :closeEditProjectTeamMemberWindow="closeEditProjectTeamMemberWindow" :handleRequestError="handleRequestError"
          @closeEW="closeEditWindow" @saveEW="saveEditWindow"></AddTeamToTeamsDialog>
        <v-spacer></v-spacer>
        <v-switch class="ml-2" v-model="activeSwitch" label="Nur Aktive"> </v-switch>
        <v-spacer></v-spacer>

        <v-sheet color="grey lighten-3" align="center">
          <v-container v-if="isAdmin()">
            <p class="caption">Als Excel-Datei exportieren:</p>
            <v-row class="align-baseline">
              <v-text-field height="60" type="text" outlined color="primary" label="Bitte Dateinamen eingeben"
                v-model="excelFileName"></v-text-field>
              <v-spacer></v-spacer>
              <v-progress-circular class="mr-4" v-if="loadingMembers" indeterminate color="primary"></v-progress-circular>
              <v-spacer></v-spacer>
              <v-btn height="60" color="primary" type="submit" outlined @click.prevent="exportExcel">
                <v-icon left>mdi-file-excel</v-icon> Jetzt exportieren
              </v-btn>
              <v-spacer></v-spacer>
            </v-row>
          </v-container>
        </v-sheet>

        <v-text-field v-model="search" label="Suchen" append-icon="search" single-line hide-details
          class="ml-2"></v-text-field>
      </template>
      <template v-slot:item.action="{ item }">
        <v-icon small class="mr-2" @click.stop="editItem(item)" v-if="!strictReadonly">
          edit
        </v-icon>
        <v-icon small @click.stop="deleteItem(item)" v-if="!strictReadonly">
          delete
        </v-icon>
      </template>
      <template v-slot:item.needs_first_aid_training="{ item }">
        <v-simple-checkbox :value="checkForTrue(item.needs_first_aid_training)" disabled>
        </v-simple-checkbox>
      </template>
    </v-data-table>
  </v-card>
</template>

<script>
import { mdiCalendarBlankMultiple } from '@mdi/js';
import AddTeamToTeamsDialog from "./AddTeamToTeamsDialog.vue";
import writeXlsxFile from "write-excel-file";

export default {
  components: { AddTeamToTeamsDialog },
  name: "ProjectTeam",
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
      excelFileName: "",
      loadingMembers: false,
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
          if (me.activeSwitch) {
            me.editedItem.members = me.editedItem.members.filter((m) => m.active);
          }
          for (let member of me.editedItem.members) {
            member.name =
              member.last_name.trim() + ", " + member.first_name.trim();
            member.agAll = me.editedItem.name;
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
    isAdmin() {
      return sessionStorage.getItem("is_admin") == "true";
    },
    async getTeamFromApi(id) {
      let response = await this.$http.get(
        "/api/project-team/" + id + "?token=" + sessionStorage.getItem("token")
      );
      let team = response.data;
      return team;
    },
    async exportExcel() {
      var me = this;
      if (me.excelFileName == "") {
        me.showAlert("error", "Bitte Dateinamen eingeben");
        return;
      }
      if (!me.excelFileName.endsWith(".xlsx")) {
        me.excelFileName = me.excelFileName + ".xlsx";
      }
      let teams = me.projectTeams;


      try {
        this.loadingMembers = true;
        for (let t of teams) {
          let t2 = await this.getTeamFromApi(t.id);
          t.leaders = t2.members
            .filter((m) => m.project_team_member.member_role_title == "Vorsitz")
            .map((m) => m.first_name + " " + m.last_name).join(", ");
          console.log("leaders", t.name, t.leaders);
        }
      } finally {
        this.loadingMembers = false;
      }

      const schema = this.makeSchema();

      await writeXlsxFile(teams, {
        schema,
        fileName: me.excelFileName,
      });
      me.excelFileName = "";
    },


    makeSchema() {
      return [
        {
          column: "Name",
          type: String,
          value: (team) => team.name,
          width: 30,
        },
        {
          column: "Email",
          type: String,
          value: (team) => team.email,
          width: 60,
        },
        {
          column: "EHK benötigt",
          type: Boolean,
          value: (team) => team.needs_first_aid_training == "1",
          width: 15,
        },
        {
          column: "Beschreibung",
          type: String,
          value: (team) => team.description,
          width: 60,
        },
        {
          column: "Kommentar",
          type: String,
          value: (team) => team.comments,
          width: 60,
        },
        {
          column: "Leiter*innen",
          type: String,
          value: (team) => team.leaders,
          width: 60,
        },
      ];
    }

  },
};
</script>
