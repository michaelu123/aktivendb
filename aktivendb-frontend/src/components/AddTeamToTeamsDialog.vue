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
        <span class="headline">AG</span>
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
  ],
  methods: {
    closeEW() {
      this.$emit("closeEW");
    },
    saveEW() {
      this.$emit("saveEW");
    },
    saveEditProjectTeamMemberWindow: function() {
      this.editWindow.memberList.editProjectTeamMemberWindow.saveInProgress = true;
      var me = this;

      if (this.editWindow.memberList.editedProjectTeamMemberIndex > -1) {
        var projectTeamMemberId = this.editWindow.memberList
          .editedProjectTeamMember.project_team_member.id;
        this.$http
          .put(
            "/api/project-team-member/" +
              projectTeamMemberId +
              "?token=" +
              sessionStorage.getItem("token"),
            this.editWindow.memberList.editedProjectTeamMember
              .project_team_member,
          )
          .then(function(response) {
            Object.assign(
              me.members[me.editWindow.memberList.editedProjectTeamMemberIndex]
                .project_team_member,
              response.data,
            );
            me.closeEditProjectTeamMemberWindow();
          })
          .catch(function(error) {
            me.handleRequestError(
              error,
              me.editWindow.memberList.editProjectTeamMemberWindow,
            );
          });
      } else {
        this.editWindow.memberList.editedProjectTeamMember.project_team_member.project_team_id = this.editedItem.id;
        this.$http
          .post(
            "/api/project-team-member?token=" + sessionStorage.getItem("token"),
            this.editWindow.memberList.editedProjectTeamMember
              .project_team_member,
          )
          .then(function(response) {
            var memberNewId = response.data.member_id;
            var memberNew = me.allMembers.find(
              (member) => member.id == memberNewId,
            );
            memberNew.project_team_member = response.data;

            me.members.push(memberNew);
            me.closeEditProjectTeamMemberWindow();
          })
          .catch(function(error) {
            me.handleRequestError(
              error,
              me.editWindow.memberList.editProjectTeamMemberWindow,
            );
          });
      }
    },
    showProjectTeamMemberItem: function(item) {
      this.editWindow.memberList.editedProjectTeamMemberIndex = this.members.indexOf(
        item,
      );
      this.editWindow.memberList.editProjectTeamMemberWindow.loading = true;

      this.editWindow.memberList.editedProjectTeamMember = Object.assign(
        this.members[this.editWindow.memberList.editedProjectTeamMemberIndex],
        item,
      );

      this.editWindow.memberList.editProjectTeamMemberWindow.shown = true;
    },
    viewProjectTeamMemberItem: function(item) {
      this.showProjectTeamMemberItem(item);
      this.editWindow.memberList.editProjectTeamMemberWindow.readonly = true;
    },
    editProjectTeamMemberItem: function(item) {
      this.showProjectTeamMemberItem(item);
      this.editWindow.memberList.editProjectTeamMemberWindow.readonly =
        this.strictReadonly || false;
    },
    deleteProjectTeamMemberItem: function(item) {
      var index = this.editedItem.members.indexOf(item);
      var me = this;

      if (confirm("Are you sure you want to delete this item?")) {
        var projectTeamMember = this.editedItem.members[index]
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
            tmpEditedItem.members.splice(index, 1);

            me.editedItem = Object.assign({}, tmpEditedItem);

            me.showAlert("success", "Gelöscht");
          })
          .catch(function(error) {
            me.handleRequestError(error);
          });
      }
    },
  },
};
</script>
