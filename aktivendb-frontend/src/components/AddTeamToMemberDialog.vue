<template>
  <v-dialog v-model="editWindow.teamList.editProjectTeamMemberWindow.shown">
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
        <span class="headline">Mitgliedschaft</span>
      </v-card-title>

      <v-card-text>
        <v-container>
          <v-form
            ref="form"
            v-model="editWindow.teamList.editProjectTeamMemberWindow.formValid"
            lazy-validation
          >
            <v-select
              v-model="
                editWindow.teamList.editedProjectTeamMember.project_team_member
                  .member_role_id
              "
              :items="memberRoles"
              item-text="title"
              item-value="id"
              label="Rolle"
              :readonly="
                editWindow.teamList.editProjectTeamMemberWindow.readonly
              "
              :error="
                !!editWindow.teamList.editProjectTeamMemberWindow.errors
                  .member_role_id
              "
              :error-messages="
                editWindow.teamList.editProjectTeamMemberWindow.errors
                  .member_role_id
              "
            ></v-select>
            <v-text-field
              v-model="editedItem.name"
              label="Person"
              readonly
            ></v-text-field>
            <v-select
              v-if="editProjectTeamMemberNew"
              v-model="
                editWindow.teamList.editedProjectTeamMember.project_team_member
                  .project_team_id
              "
              :items="allProjectTeams"
              item-text="name"
              item-value="id"
              label="AG/Gruppe"
              :readonly="
                editWindow.teamList.editProjectTeamMemberWindow.readonly
              "
              :error="
                !!editWindow.teamList.editProjectTeamMemberWindow.errors
                  .project_team_id
              "
              :error-messages="
                editWindow.teamList.editProjectTeamMemberWindow.errors
                  .project_team_id
              "
            ></v-select>
            <v-text-field
              v-if="!editProjectTeamMemberNew"
              v-model="editWindow.teamList.editedProjectTeamMember.name"
              label="AG/Gruppe"
              readonly
            ></v-text-field>
            <v-textarea
              v-model="
                editWindow.teamList.editedProjectTeamMember.project_team_member
                  .admin_comments
              "
              label="Kommentar"
              rows="3"
              auto-grow
              :readonly="
                editWindow.teamList.editProjectTeamMemberWindow.readonly
              "
              :error="
                !!editWindow.teamList.editProjectTeamMemberWindow.errors
                  .admin_comments
              "
              :error-messages="
                editWindow.teamList.editProjectTeamMemberWindow.errors
                  .admin_comments
              "
            ></v-textarea>
          </v-form>
        </v-container>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="closeTM">Abbrechen</v-btn>
        <v-btn
          text
          @click="saveTM"
          :loading="
            editWindow.teamList.editProjectTeamMemberWindow.saveInProgress
          "
          v-if="!editWindow.teamList.editProjectTeamMemberWindow.readonly"
          >Speichern</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: "AddTeamToMemberDialog",
  props: [
    "editWindow",
    "editedItem",
    "memberRoles",
    "allProjectTeams",
    "strictReadonly",
  ],
  computed: {
    editProjectTeamMemberNew() {
      return this.editWindow.teamList.editedProjectTeamMemberIndex == -1;
    },
  },

  methods: {
    saveTM() {
      this.$emit("saveTM");
    },
    closeTM() {
      this.$emit("closeTM");
    },
  },
};
</script>
