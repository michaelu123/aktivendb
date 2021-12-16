<template>
  <v-dialog v-model="editWindow.shown">
    <template v-slot:activator="{ on }">
      <v-btn
        color="primary"
        outlined
        class="mb-2"
        v-on="on"
        v-if="!strictReadonly && isAdmin()"
      >
        <v-icon left>add</v-icon> AG Hinzufügen
      </v-btn>
    </template>
    <v-card>
      <v-card-title>
        <span class="headline">AG</span>
        <v-alert
          :type="alert.type"
          outlined
          v-model="alert.shown"
          dismissible
          width="100%"
        >
          {{ alert.text }}
        </v-alert>
      </v-card-title>

      <v-card-text v-if="editWindow.loading">
        Wird geladen...
        <v-progress-circular
          indeterminate
          color="primary"
        ></v-progress-circular>
      </v-card-text>

      <v-sheet color="grey lighten-3" align="center">
        <v-container>
          <p class="caption">Als Excel-Datei exportieren:</p>
          <v-row class="align-baseline">
            <v-text-field
              height="60"
              type="text"
              outlined
              color="primary"
              label="Bitte Dateinamen eingeben"
              v-model="excelFileName"
            ></v-text-field>
            <v-menu offset_y>
              <template v-slot:activator="{ on: activationEvents }">
                <v-btn
                  outlined
                  color="primary"
                  height="60"
                  text
                  class="mx-4"
                  v-on="activationEvents"
                >
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
            <v-btn
              height="60"
              color="primary"
              type="submit"
              outlined
              @click.prevent="exportExcel"
            >
              <v-icon left>mdi-file-excel</v-icon> Jetzt exportieren
            </v-btn>
            <v-spacer></v-spacer>
          </v-row>
        </v-container>
      </v-sheet>

      <v-card-text v-if="!editWindow.loading">
        <v-container>
          <v-form ref="form" v-model="editWindow.formValid" lazy-validation>
            <v-text-field
              v-model="editedItem.name"
              label="Name"
              required
              :readonly="editWindow.readonly"
              :error="!!editWindow.errors.name"
              :error-messages="editWindow.errors.name"
            ></v-text-field>
            <v-text-field
              v-model="editedItem.email"
              label="E-mail"
              :readonly="editWindow.readonly"
              :error="!!editWindow.errors.email"
              :error-messages="editWindow.errors.email"
            ></v-text-field>
            <v-textarea
              v-model="editedItem.description"
              label="Beschreibung"
              rows="2"
              auto-grow
              :readonly="editWindow.readonly"
              :error="!!editWindow.errors.description"
              :error-messages="editWindow.errors.description"
            ></v-textarea>
            <v-textarea
              v-model="editedItem.comments"
              label="Kommentar"
              rows="2"
              auto-grow
              :readonly="editWindow.readonly"
              :error="!!editWindow.errors.comments"
              :error-messages="editWindow.errors.comments"
            ></v-textarea>
            <v-switch
              v-model="editedItem.needs_first_aid_training"
              label="1. Hilfe Schulung"
              :disabled="editWindow.readonly"
              :value-comparator="checkForTrue"
              :error="!!editWindow.errors.needs_first_aid_training"
              :error-messages="editWindow.errors.needs_first_aid_training"
            ></v-switch>
          </v-form>

          <template v-if="editedItem.id > 0">
            <v-data-table
              :headers="editWindow.memberList.headers"
              :items="members"
              :search="searchEditWindow"
              @click:row="viewProjectTeamMemberItem"
            >
              <template v-slot:top>
                <AddMemberToTeamDialog
                  :editWindow="editWindow"
                  :editedItem="editedItem"
                  :memberRoles="memberRoles"
                  :allMembers="allMembers"
                  :strictReadonly="strictReadonly"
                  @saveTM="saveEditProjectTeamMemberWindow"
                  @closeTM="closeEditProjectTeamMemberWindow"
                ></AddMemberToTeamDialog>

                <v-spacer></v-spacer>
                <v-text-field
                  v-model="searchEditWindow"
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
                  @click.stop="editProjectTeamMemberItem(item)"
                  v-if="!strictReadonly"
                >
                  edit
                </v-icon>
                <v-icon
                  small
                  @click.stop="deleteProjectTeamMemberItem(item)"
                  v-if="!strictReadonly"
                >
                  delete
                </v-icon>
              </template>
            </v-data-table>
          </template>
        </v-container>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="closeEW">Abbrechen</v-btn>
        <v-btn
          text
          @click="saveEW"
          :loading="editWindow.saveInProgress"
          v-if="!editWindow.readonly"
          >Speichern</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import AddMemberToTeamDialog from "./AddMemberToTeamDialog.vue";
import writeXlsxFile from "write-excel-file";

export default {
  components: { AddMemberToTeamDialog },
  name: "AddTeamToTeamsDialog",
  props: [
    "editWindow",
    "editedItem",
    "memberRoles",
    "members",
    "allMembers",
    "strictReadonly",
    "searchEditWindow",
    "checkForTrue",
    "closeEditProjectTeamMemberWindow",
    "handleRequestError",
  ],
  data() {
    return {
      alert: {
        shown: false,
        text: "",
        type: "success",
      },
      excelFileName: "",
      preferredEmail: "Bevorzugte Email-Adresse",
    };
  },
  methods: {
    closeEW() {
      this.$emit("closeEW");
    },
    saveEW() {
      this.$emit("saveEW");
    },
    saveEditProjectTeamMemberWindow: function () {
      var me = this;
      me.editWindow.memberList.editProjectTeamMemberWindow.saveInProgress = true;

      if (me.editWindow.memberList.editedProjectTeamMemberIndex > -1) {
        var projectTeamMemberId =
          me.editWindow.memberList.editedProjectTeamMember.project_team_member
            .id;
        me.$http
          .put(
            "/api/project-team-member/" +
              projectTeamMemberId +
              "?token=" +
              sessionStorage.getItem("token"),
            me.editWindow.memberList.editedProjectTeamMember.project_team_member
          )
          .then(function (response) {
            Object.assign(
              me.members[me.editWindow.memberList.editedProjectTeamMemberIndex]
                .project_team_member,
              response.data
            );
            me.closeEditProjectTeamMemberWindow();
          })
          .catch(function (error) {
            me.handleRequestError(
              error,
              me.editWindow.memberList.editProjectTeamMemberWindow
            );
          });
      } else {
        me.editWindow.memberList.editedProjectTeamMember.project_team_member.project_team_id =
          me.editedItem.id;
        me.$http
          .post(
            "/api/project-team-member?token=" + sessionStorage.getItem("token"),
            me.editWindow.memberList.editedProjectTeamMember.project_team_member
          )
          .then(function (response) {
            var memberNewId = response.data.member_id;
            var memberNew = me.allMembers.find(
              (member) => member.id == memberNewId
            );
            memberNew.project_team_member = response.data;

            me.members.push(memberNew);
            me.closeEditProjectTeamMemberWindow();
          })
          .catch(function (error) {
            me.handleRequestError(
              error,
              me.editWindow.memberList.editProjectTeamMemberWindow
            );
          });
      }
    },
    showProjectTeamMemberItem: function (item) {
      this.editWindow.memberList.editedProjectTeamMemberIndex =
        this.members.indexOf(item);
      this.editWindow.memberList.editProjectTeamMemberWindow.loading = true;

      this.editWindow.memberList.editedProjectTeamMember = Object.assign(
        this.members[this.editWindow.memberList.editedProjectTeamMemberIndex],
        item
      );

      this.editWindow.memberList.editProjectTeamMemberWindow.shown = true;
    },
    viewProjectTeamMemberItem: function (item) {
      this.showProjectTeamMemberItem(item);
      this.editWindow.memberList.editProjectTeamMemberWindow.readonly = true;
    },
    editProjectTeamMemberItem: function (item) {
      this.showProjectTeamMemberItem(item);
      this.editWindow.memberList.editProjectTeamMemberWindow.readonly =
        this.strictReadonly || false;
    },
    deleteProjectTeamMemberItem: function (item) {
      var me = this;
      var index = me.editedItem.members.indexOf(item);

      if (confirm("Are you sure you want to delete this item?")) {
        var projectTeamMember =
          me.editedItem.members[index].project_team_member.id;
        me.$http
          .delete(
            "/api/project-team-member/" +
              projectTeamMember +
              "?token=" +
              sessionStorage.getItem("token")
          )
          .then(function (response) {
            var tmpEditedItem = me.editedItem;
            tmpEditedItem.members.splice(index, 1);

            me.editedItem = Object.assign({}, tmpEditedItem);

            me.showAlert("success", "Gelöscht");
          })
          .catch(function (error) {
            me.handleRequestError(error);
          });
      }
    },
    showAlert(type, text) {
      this.alert.shown = true;
      this.alert.type = type;
      this.alert.text = text;

      setTimeout(() => {
        this.alert.shown = false;
      }, 5000);
    },
    isAdmin() {
      return sessionStorage.getItem("is_admin");

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

      const schema = [
        /*
        {
          column: "Name",
          type: String,
          value: (member) => member.name,
          width: nameWidth,
        },
        */
        {
          column: "Nachname",
          type: String,
          value: (member) => member.last_name,
          width: 30,
        },
        {
          column: "Vorname",
          type: String,
          value: (member) => member.first_name,
          width: 30,
        },
        {
          column: "Geschlecht",
          type: String,
          value: (member) => member.gender,
          width: 10,
        },
        {
          column: "Geburtsjahr",
          type: String,
          value: (member) => member.birthday,
          width: 12,
        },
        {
          column: "Postleitzahl",
          type: String,
          value: (member) => member.address,
          width: 12,
        },
        {
          column: "ADFC-Mitgliedsnummer",
          type: Number,
          value: (member) =>
            member.adfc_id == null ? null : parseInt(member.adfc_id),
          width: 22,
        },
        {
          column: "Email-ADFC",
          type: String,
          value: (member) => member.email_adfc,
          width: 30,
        },
        {
          column: "Email-Privat",
          type: String,
          value: (member) => member.email_private,
          width: 30,
        },
        {
          column: "Email",
          type: String,
          value: function (member) {
            let email = "";
            if (me.preferredEmail.endsWith("ADFC")) {
              email =
                member.email_adfc != ""
                  ? member.email_adfc
                  : member.email_private;
            } else {
              email =
                member.email_private != ""
                  ? member.email_private
                  : member.email_adfc;
            }
            return email;
          },
          width:30,
        },
        {
          column: "Telefon",
          type: String,
          value: (member) => member.phone_primary,
          width: 20,
        },
        {
          column: "Telefon-Alternative",
          type: String,
          value: (member) => member.phone_secondary,
          width: 20,
        },
        {
          column: "Interessen",
          type: String,
          value: (member) => member.interests,
          width: 30,
        },
        {
          column: "Letztes Erste-Hilfe-Training",
          type: Date,
          format: "yyyy-mm-dd",
          value: function (member) {
            let t = member.latest_first_aid_training;
            // console.log("d1", t);
            let d;
            if (t == null) {
              d = null; //d = new Date(1900, 0, 1, 12);
              // console.log("d2", d);
            } else {
              let y = parseInt(t.substring(0, 4));
              let m = parseInt(t.substring(5, 7));
              let dy = parseInt(t.substring(8, 10));
              d = new Date(y, m - 1, dy, 6);
              // console.log("d3", y, m, dy, d);
            }
            return d;
          },
          width: 15,
        },
        {
          column: "Registriert für Erste-Hilfe-Training",
          type: Boolean,
          value: (member) => member.registered_for_first_aid_training == "1",
          width: 15,
        },
      ];
      await writeXlsxFile(me.members, {
        schema,
        fileName: me.excelFileName,
      });
      me.excelFileName = "";
    },
    prefer(t) {
      // console.log("prefer", t);
      this.preferredEmail = "Bevorzugt: " + t;
    },
  },
};
</script>
