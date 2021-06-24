<template>
  <v-dialog v-model="editWindow.memberList.editProjectTeamMemberWindow.shown">
    <template v-slot:activator="{ on }">
      <v-btn
        color="primary"
        outlined
        class="mb-2"
        v-on="on"
        v-if="!strictReadonly"
      >
        <v-icon left>add</v-icon> Mitglied hinzufügen
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
            v-model="
              editWindow.memberList.editProjectTeamMemberWindow.formValid
            "
            lazy-validation
          >
            <v-select
              v-model="
                editWindow.memberList.editedProjectTeamMember
                  .project_team_member.member_role_id
              "
              :items="memberRoles"
              item-text="title"
              item-value="id"
              label="Rolle"
              :readonly="
                editWindow.memberList.editProjectTeamMemberWindow.readonly
              "
              :error="
                !!editWindow.memberList.editProjectTeamMemberWindow.errors
                  .member_role_id
              "
              :error-messages="
                editWindow.memberList.editProjectTeamMemberWindow.errors
                  .member_role_id
              "
            ></v-select>
            <v-text-field
              v-model="editedItem.name"
              label="AG/Gruppe"
              readonly
            ></v-text-field>
            <v-select
              v-if="editProjectTeamMemberNew"
              v-model="
                editWindow.memberList.editedProjectTeamMember
                  .project_team_member.member_id
              "
              :items="allMembers"
              item-text="name"
              item-value="id"
              label="Person"
              :readonly="
                editWindow.memberList.editProjectTeamMemberWindow.readonly
              "
              :error="
                !!editWindow.memberList.editProjectTeamMemberWindow.errors
                  .member_id
              "
              :error-messages="
                editWindow.memberList.editProjectTeamMemberWindow.errors
                  .member_id
              "
            ></v-select>
            <v-text-field
              v-if="!editProjectTeamMemberNew"
              v-model="editWindow.memberList.editedProjectTeamMember.name"
              label="Person"
              readonly
            ></v-text-field>
            <v-textarea
              v-model="
                editWindow.memberList.editedProjectTeamMember
                  .project_team_member.admin_comments
              "
              label="Kommentar"
              rows="3"
              auto-grow
              :readonly="
                editWindow.memberList.editProjectTeamMemberWindow.readonly
              "
              :error="
                !!editWindow.memberList.editProjectTeamMemberWindow.errors
                  .admin_comments
              "
              :error-messages="
                editWindow.memberList.editProjectTeamMemberWindow.errors
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
            editWindow.memberList.editProjectTeamMemberWindow.saveInProgress
          "
          v-if="!editWindow.memberList.editProjectTeamMemberWindow.readonly"
          >Speichern</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: "AddMemberToTeamDialog",
  props: [
    "editWindow",
    "editedItem",
    "memberRoles",
    "allMembers",
    "strictReadonly",
  ],
  computed: {
    editProjectTeamMemberNew() {
      return this.editWindow.memberList.editedProjectTeamMemberIndex == -1;
    },
  },
  methods: {
    saveTM() {
      this.$emit("saveTM"); // saveEditProjectTeamMemberWindow
    },
    closeTM() {
      this.$emit("closeTM"); // closeEditProjectTeamMemberWindow
    },
  },
};
</script>
