<template>
  <v-card>
    <v-card-title>
      <div>
        <v-alert :type="alert.type" outlined v-model="alert.shown" dismissible width="100%">
          {{ alert.text }}
        </v-alert>
      </div>
    </v-card-title>
    <v-data-table :headers="headers" :items="members" :search="search" :loading="loading" loading-text="Wird geladen..."
      @click:row="viewItem">
      <template v-slot:top>
        <AddMemberToMembersDialog :editWindow="editWindow" :editedItem="editedItem" :memberRoles="memberRoles"
          :projectTeams="projectTeams" :allProjectTeams="allProjectTeams" :strictReadonly="strictReadonly"
          :searchEditWindow="searchEditWindow" :checkForTrue="checkForTrue"
          :closeEditProjectTeamMemberWindow="closeEditProjectTeamMemberWindow" :handleRequestError="handleRequestError"
          @closeEW="closeEditWindow" @saveEW="saveEditWindow"></AddMemberToMembersDialog>
        <v-spacer></v-spacer>
        <v-row class="ml-2">
          <v-switch v-model="activeSwitch" label="Nur Aktive"> </v-switch>
          &nbsp;&nbsp;&nbsp;
          <v-switch v-if="!isAdmin()" v-model="agSwitch" label="Nur AG/OG-Mitglieder"> </v-switch>
        </v-row>
        <v-spacer></v-spacer>

        <v-sheet color="grey lighten-3" align="center">
          <v-container>
            <p class="caption">Als Excel-Datei exportieren:</p>
            <v-row class="align-baseline">
              <v-text-field height="60" type="text" outlined color="primary" label="Bitte Dateinamen eingeben"
                v-model="excelFileName"></v-text-field>
              <v-menu offset_y>
                <template v-slot:activator="{ on: activationEvents }">
                  <v-btn outlined color="primary" height="60" text class="mx-4" v-on="activationEvents">
                    {{ preferredEmail }}
                  </v-btn>
                </template>
                <v-list>
                  <v-list-item key="1" @click="prefer('ADFC')">
                    <v-list-item-title>ADFC-Email-Adresse</v-list-item-title>
                  </v-list-item>
                  <v-list-item key="2" @click="prefer('Privat')">
                    <v-list-item-title>Private Email-Adresse</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
              <v-progress-circular class="mr-4" v-if="loadingTeams" indeterminate color="primary"></v-progress-circular>
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
        <v-icon small class="mr-2" @click.stop="editItem(item)" v-if="!strictReadonly && item.with_details">
          edit
        </v-icon>
        <v-icon small @click.stop="deleteItem(item)" v-if="!strictReadonly && isAdmin()">
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
      <template v-slot:item.registered_for_first_aid_training="{ item }">
        <v-avatar color="green" size="24" v-if="checkForTrue(item.registered_for_first_aid_training)">
          <v-icon small dense class="white--text">
            mdi-checkbox-marked-circle-outline
          </v-icon>
        </v-avatar>
        <v-avatar color="red" size="24" v-if="!checkForTrue(item.registered_for_first_aid_training)">
          <v-icon small dense class="white--text">
            mdi-checkbox-blank-circle-outline
          </v-icon>
        </v-avatar>
      </template>
      <template v-slot:item.responded_to_questionaire="{ item }">
        <v-avatar color="green" size="24" v-if="checkForTrue(item.responded_to_questionaire)">
          <v-icon small dense class="white--text">
            mdi-checkbox-marked-circle-outline
          </v-icon>
        </v-avatar>
        <v-avatar color="red" size="24" v-if="!checkForTrue(item.responded_to_questionaire)">
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
import writeXlsxFile from "write-excel-file";
import makeSchema from "./common"

export default {
  components: { AddMemberToMembersDialog },
  name: "Member",
  data() {
    return {
      search: "",
      strictReadonly: false,
      searchEditWindow: "",
      activeSwitch: true,
      agSwitch: false,
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
        showNextFirstAidTrainingDatePicker: false,
        showQuestResponseDatePicker: false,
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
          filter: (value, _se, item) => {
            // could not get v-data-table.custom-filter to work
            if (this.agSwitch && !item.with_details) return false;

            if (!this.activeSwitch) return true;

            return this.checkForTrue(value);
          },
        },
        /*
        {
          text: "Name",
          value: "name",
        },
        */
        {
          text: "Nachname",
          value: "last_name",
        },
        {
          text: "Vorname",
          value: "first_name",
        },
        {
          text: "Geburtsjahr",
          value: "birthday",
        },
        {
          text: "Geschlecht",
          value: "gender",
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
          value: "phone",
        },
        {
          text: "Letzter Kontakt",
          value: "latest_contact",
        },
        {
          text: "Status",
          value: "status",
        },
        {
          text: "Letzte 1. Hilfe Schulung",
          value: "latest_first_aid_training",
        },
        {
          text: "Registriert für Schulung",
          value: "registered_for_first_aid_training",
        },
        {
          text: "Nächste 1. Hilfe Schulung",
          value: "next_first_aid_training",
        },
        {
          text: "Fragebogen ausgefüllt",
          value: "responded_to_questionaire",
        },
        {
          text: "Datum Fragebogen",
          value: "responded_to_questionaire_at",
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
        next_first_aid_training: null,
        gender: "",
        interests: "",
        latest_contact: null,
        active: true,
        registered_for_first_aid_training: false,
        responded_to_questionaire: false,
        responded_to_questionaire_at: null,
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
        next_first_aid_training: null,
        gender: "",
        interests: "",
        latest_contact: null,
        active: true,
        registered_for_first_aid_training: false,
        responded_to_questionaire: false,
        responded_to_questionaire_at: null,
        user: null,
        project_teams: [],
      },
      memberRoles: [],
      excelFileName: "",
      preferredEmail: "Bevorzugte Email-Adresse",
      loadingTeams: false,
    };
  },
  watch: {
    "editWindow.shown": {
      deep: true,
      handler: function (val) {
        val || this.closeEditWindow();
      },
    },
    "editWindow.teamList.editProjectTeamMemberWindow.shown": {
      deep: true,
      handler: function (val) {
        val || this.closeEditProjectTeamMemberWindow();
      },
    },
    "editedItem.project_teams": {
      deep: true,
      handler: function (val) {
        if (!val) val = [];
        this.projectTeams = val;
      },
    },
  },
  mounted() {
    this.strictReadonly = sessionStorage.getItem("readonly") == 1;
    this.getAllMembersFromApi().then((data) => {
      let res = data.items;
      for (let member of res) {
        member.name = member.last_name.trim() + ", " + member.first_name.trim();
        member.phone = member.phone_primary ? member.phone_primary : member.phone_secondary;
      }
      res.sort((a, b) => (a.name < b.name ? -1 : a.name == b.name ? 0 : 1));
      this.members = res;
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
      this.allProjectTeams = res2;
    });
  },
  methods: {
    handleRequestError(error, scope) {
      this.is_logged_in = false;
      if (error.response) {
        console.log("error4", error.response);
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
    getAllMembersFromApi() {
      var me = this;
      me.loading = true;

      return new Promise((resolve, reject) => {
        let items = [];
        // console.log("token", sessionStorage.getItem("token"));

        this.$http
          .get("/api/members?token=" + sessionStorage.getItem("token"))
          .then(function (response) {
            me.loading = false;
            items = response.data;
            for (let member of items) {
              if (member.email_adfc == "undef@undef.de") member.email_adfc = "";
              if (member.email_private == "undef@undef.de") member.email_private = "";
            }

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
    getAllProjectTeamsFromApi() {
      return new Promise((resolve, reject) => {
        var me = this;
        let items = [];

        this.$http
          .get("/api/project-teams?token=" + sessionStorage.getItem("token"))
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
      this.editedIndex = this.members.indexOf(item);
      this.editWindow.loading = true;
      var memberId = this.members[this.editedIndex].id;
      var me = this;

      this.$http
        .get(
          "/api/member/" +
          memberId +
          "?token=" +
          sessionStorage.getItem("token")
        )
        .then(function (response) {
          me.editWindow.loading = false;
          let member = response.data;
          if (member.email_adfc == "undef@undef.de") member.email_adfc = "";
          if (member.email_private == "undef@undef.de") member.email_private = "";
          Object.assign(me.members[me.editedIndex], member);
          me.editedItem = Object.assign(item, member);
          try {
            me.editedItem.active = me.checkForTrue(me.editedItem.active);
            me.editedItem.registered_for_first_aid_training = me.checkForTrue(
              me.editedItem.registered_for_first_aid_training
            );
            me.editedItem.responded_to_questionaire = me.checkForTrue(
              me.editedItem.responded_to_questionaire
            );
            me.editedItem.name =
              me.editedItem.last_name.trim() +
              ", " +
              me.editedItem.first_name.trim();
          } catch (ex) {
            console.log("showItem ex", ex);
          }
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
      var index = this.members.indexOf(item);
      var me = this;

      if (confirm("Are you sure you want to delete this item?")) {
        var memberId = this.members[index].id;
        this.$http
          .delete(
            "/api/member/" +
            memberId +
            "?token=" +
            sessionStorage.getItem("token")
          )
          .then(function () {
            me.members.splice(index, 1);

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
      this.editWindow.teamList.editProjectTeamMemberWindow.saveInProgress = false;
      this.editWindow.teamList.editProjectTeamMemberWindow.shown = false;
      this.editWindow.teamList.editProjectTeamMemberWindow.readonly = false;
      setTimeout(() => {
        this.editedProjectTeamMember = Object.assign(
          {},
          this.editWindow.teamList.defaultProjectTeamMember
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
        this.editedItem.name =
          this.editedItem.last_name.trim() +
          ", " +
          this.editedItem.first_name.trim();
        this.$http
          .put(
            "/api/member/" +
            memberId +
            "?token=" +
            sessionStorage.getItem("token"),
            this.editedItem
          )
          .then(function (response) {
            Object.assign(me.members[me.editedIndex], response.data);
            me.closeEditWindow();

            me.showAlert("success", "Gespeichert");
          })
          .catch(function (error) {
            me.handleRequestError(error, me.editWindow);
          });
      } else {
        this.$http
          .post(
            "/api/member?token=" + sessionStorage.getItem("token"),
            this.editedItem
          )
          .then(function (response) {
            me.members.push(response.data);
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
    async getMemberFromApi(id) {
      let response = await this.$http.get(
        "/api/member/" + id + "?token=" + sessionStorage.getItem("token")
      );
      let member = response.data;
      if (member.email_adfc == "undef@undef.de") member.email_adfc = "";
      if (member.email_private == "undef@undef.de") member.email_private = "";
      return member;
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
      if (me.preferredEmail == "Bevorzugte Email-Adresse") {
        me.showAlert("error", "Bitte Email-Präferenz eingeben");
        return;
      }

      let myMembers = [];
      try {
        this.loadingTeams = true;
        for (let m of me.members) {
          if (!m.with_details)
            continue;
          let m2 = await this.getMemberFromApi(m.id);
          m.ags = m2.project_teams.map((t) => t.name).join(",");
          console.log("ags", m.name, m.ags);
          myMembers.push(m);
        }
      } finally {
        this.loadingTeams = false;
      }
      const schema = makeSchema(me);

      if (this.activeSwitch) {
        myMembers = myMembers.filter(m => m.active == "1")
      }


      await writeXlsxFile(myMembers, {
        schema,
        fileName: me.excelFileName,
      });
      me.excelFileName = "";
    },
    prefer(t) {
      console.log("prefer", t);
      this.preferredEmail = "Bevorzugt: " + t;
    },
  },
};
</script>
