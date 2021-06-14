<template>
  <v-dialog v-model="editWindow.shown">
    <template v-slot:activator="{ on }">
      <v-btn
        color="primary"
        outlined
        class="mb-2"
        v-on="on"
        v-if="!strictReadonly"
      >
        <v-icon left>add</v-icon> Hinzufügen
      </v-btn>
    </template>
    <v-card>
      <v-card-title>
        <span class="headline">Mitglied</span>
      </v-card-title>

      <v-card-text v-if="editWindow.loading">
        Wird geladen...
        <v-progress-circular
          indeterminate
          color="primary"
        ></v-progress-circular>
      </v-card-text>

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
              v-model="editedItem.email_adfc"
              label="E-mail (ADFC)"
              :readonly="editWindow.readonly"
              :error="!!editWindow.errors.email_adfc"
              :error-messages="editWindow.errors.email_adfc"
            ></v-text-field>
            <v-text-field
              v-model="editedItem.email_private"
              label="E-mail (Privat)"
              required
              :readonly="editWindow.readonly"
              :error="!!editWindow.errors.email_private"
              :error-messages="editWindow.errors.email_private"
            ></v-text-field>
            <v-text-field
              v-model="editedItem.phone_primary"
              label="Telefon"
              :readonly="editWindow.readonly"
              :error="!!editWindow.errors.phone_primary"
              :error-messages="editWindow.errors.phone_primary"
            ></v-text-field>
            <v-text-field
              v-model="editedItem.phone_secondary"
              label="Telefon (alternativ)"
              :readonly="editWindow.readonly"
              :error="!!editWindow.errors.phone_secondary"
              :error-messages="editWindow.errors.phone_secondary"
            ></v-text-field>
            <v-menu
              v-model="editWindow.showLatestContactDatePicker"
              :close-on-content-click="false"
              :nudge-right="40"
              transition="scale-transition"
              offset-y
              min-width="290px"
              :disabled="editWindow.readonly"
            >
              <template v-slot:activator="{ on }">
                <v-text-field
                  v-model="editedItem.latest_contact"
                  label="Letzter Kontakt"
                  prepend-icon="event"
                  readonly
                  v-on="on"
                  :error="!!editWindow.errors.latest_contact"
                  :error-messages="editWindow.errors.latest_contact"
                ></v-text-field>
              </template>
              <v-date-picker
                v-model="editedItem.latest_contact"
                @input="editWindow.showLatestContactDatePicker = false"
                locale="de-de"
                :max="today"
              ></v-date-picker>
            </v-menu>
            <v-textarea
              v-model="editedItem.address"
              label="Adresse"
              rows="2"
              auto-grow
              :readonly="editWindow.readonly"
              :error="!!editWindow.errors.address"
              :error-messages="editWindow.errors.address"
            ></v-textarea>
            <v-text-field
              v-model="editedItem.adfc_id"
              label="Mitgliedsnummer"
              type="number"
              :readonly="editWindow.readonly"
              :error="!!editWindow.errors.adfc_id"
              :error-messages="editWindow.errors.adfc_id"
            ></v-text-field>
            <v-textarea
              v-model="editedItem.admin_comments"
              label="Kommentar"
              rows="2"
              auto-grow
              :readonly="editWindow.readonly"
              :error="!!editWindow.errors.admin_comments"
              :error-messages="editWindow.errors.admin_comments"
            ></v-textarea>
            <v-menu
              v-model="editWindow.showLatestFirstAidTrainingDatePicker"
              :close-on-content-click="false"
              :nudge-right="40"
              transition="scale-transition"
              offset-y
              min-width="290px"
              :disabled="editWindow.readonly"
            >
              <template v-slot:activator="{ on }">
                <v-text-field
                  v-model="editedItem.latest_first_aid_training"
                  label="Letzte 1. Hilfe Schulung"
                  prepend-icon="event"
                  readonly
                  v-on="on"
                  :error="!!editWindow.errors.latest_first_aid_training"
                  :error-messages="editWindow.errors.latest_first_aid_training"
                ></v-text-field>
              </template>
              <v-date-picker
                v-model="editedItem.latest_first_aid_training"
                @input="editWindow.showLatestFirstAidTrainingDatePicker = false"
                locale="de-de"
                :max="today"
              ></v-date-picker>
            </v-menu>
            <v-textarea
              v-model="editedItem.interests"
              label="Interessen"
              rows="2"
              auto-grow
              :readonly="editWindow.readonly"
              :error="!!editWindow.errors.interests"
              :error-messages="editWindow.errors.interests"
            ></v-textarea>
            <v-switch
              v-model="editedItem.active"
              label="Aktiv"
              :disabled="editWindow.readonly"
              :value-comparator="checkForTrue"
              :error="!!editWindow.errors.active"
              :error-messages="editWindow.errors.active"
            ></v-switch>
          </v-form>
          <template v-if="editedItem.id > 0">
            <v-data-table
              :headers="editWindow.teamList.headers"
              :items="projectTeams"
              :search="searchEditWindow"
              @click:row="viewProjectTeamMemberItem"
            >
              <template v-slot:top>
                <AddTeamToMemberDialog
                  :editWindow="editWindow"
                  :editedItem="editedItem"
                  :memberRoles="memberRoles"
                  :allProjectTeams="allProjectTeams"
                  :strictReadonly="strictReadonly"
                  @closeTM="closeEditProjectTeamMemberWindow"
                  @saveTM="saveEditProjectTeamMemberWindow"
                ></AddTeamToMemberDialog>
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
import AddTeamToMemberDialog from "./AddTeamToMemberDialog.vue";

export default {
  components: { AddTeamToMemberDialog },
  name: "AddMemberToMembersDialog",
  props: [
    "editWindow",
    "editedItem",
    "memberRoles",
    "projectTeams",
    "allProjectTeams",
    "strictReadonly",
    "searchEditWindow",
    "checkForTrue",
    "closeEditProjectTeamMemberWindow",
  ],
  computed: {
    today() {
      return new Date().toISOString().substring(0, 10);
    },
  },
  methods: {
    closeEW() {
      this.$emit("closeEW");
    },
    saveEW() {
      this.$emit("saveEW");
    },
    showProjectTeamMemberItem: function(item) {
      this.editWindow.teamList.editedProjectTeamMemberIndex = this.projectTeams.indexOf(
        item,
      );
      this.editWindow.teamList.editProjectTeamMemberWindow.loading = true;

      this.editWindow.teamList.editedProjectTeamMember = Object.assign(
        this.projectTeams[
          this.editWindow.teamList.editedProjectTeamMemberIndex
        ],
        item,
      );

      this.editWindow.teamList.editProjectTeamMemberWindow.shown = true;
    },
    viewProjectTeamMemberItem: function(item) {
      this.showProjectTeamMemberItem(item);
      this.editWindow.teamList.editProjectTeamMemberWindow.readonly = true;
    },
    editProjectTeamMemberItem: function(item) {
      this.showProjectTeamMemberItem(item);
      this.editWindow.teamList.editProjectTeamMemberWindow.readonly =
        this.strictReadonly || false;
    },
    deleteProjectTeamMemberItem: function(item) {
      var index = this.editedItem.project_teams.indexOf(item);
      var me = this;

      if (confirm("Are you sure you want to delete this item?")) {
        var projectTeamMember = this.editedItem.project_teams[index]
          .project_team_member.id;
        this.$http
          .delete(
            "/api/project-team-member/" +
              projectTeamMember +
              "?token=" +
              sessionStorage.getItem("token"),
          )
          .then(function(response) {
            var tmpEditedItem = me.editedItem;
            tmpEditedItem.project_teams.splice(index, 1);

            me.editedItem = Object.assign({}, tmpEditedItem);

            me.showAlert("success", "Gelöscht");
          })
          .catch(function(error) {
            me.handleRequestError(error);
          });
      }
    },
    saveEditProjectTeamMemberWindow: function() {
      this.editWindow.teamList.editProjectTeamMemberWindow.saveInProgress = true;
      var me = this;

      if (this.editWindow.teamList.editedProjectTeamMemberIndex > -1) {
        var projectTeamMemberId = this.editWindow.teamList
          .editedProjectTeamMember.project_team_member.id;
        this.$http
          .put(
            "/api/project-team-member/" +
              projectTeamMemberId +
              "?token=" +
              sessionStorage.getItem("token"),
            this.editWindow.teamList.editedProjectTeamMember
              .project_team_member,
          )
          .then(function(response) {
            Object.assign(
              me.projectTeams[
                me.editWindow.teamList.editedProjectTeamMemberIndex
              ].project_team_member,
              response.data,
            );
            me.closeEditProjectTeamMemberWindow();
          })
          .catch(function(error) {
            me.handleRequestError(
              error,
              me.editWindow.teamList.editProjectTeamMemberWindow,
            );
          });
      } else {
        this.editWindow.teamList.editedProjectTeamMember.project_team_member.member_id = this.editedItem.id;
        this.$http
          .post(
            "/api/project-team-member?token=" + sessionStorage.getItem("token"),
            this.editWindow.teamList.editedProjectTeamMember
              .project_team_member,
          )
          .then(function(response) {
            var projectTeamNewId = response.data.project_team_id;
            var projectTeamNew = me.allProjectTeams.find(
              (projectTeam) => projectTeam.id === projectTeamNewId,
            );
            projectTeamNew.project_team_member = response.data;

            me.projectTeams.push(projectTeamNew);
            me.closeEditProjectTeamMemberWindow();
          })
          .catch(function(error) {
            me.handleRequestError(
              error,
              me.editWindow.teamList.editProjectTeamMemberWindow,
            );
          });
      }
    },
  },
};
</script>
