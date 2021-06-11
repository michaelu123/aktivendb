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
                                <v-form
                                    ref="form"
                                    v-model="editWindow.formValid"
                                    lazy-validation
                                >
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
                                <template v-if="MUH && editedItem.id > 0">
                                    <v-data-table
                                        :headers="editWindow.memberList.headers"
                                        :items="members"
                                        :search="searchEditWindow"
                                        @click:row="viewProjectTeamMemberItem"
                                    >
                                        <template v-slot:top>
                                            <v-dialog v-model="editWindow.memberList.editProjectTeamMemberWindow.shown">
                                                <template v-slot:activator="{ on }">
                                                    <v-btn
                                                        color="primary"
                                                        outlined class="mb-2"
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
                                                                v-model="editWindow.memberList.editProjectTeamMemberWindow.formValid"
                                                                lazy-validation
                                                            >
                                                                <v-select
                                                                    v-model="editWindow.memberList.editedProjectTeamMember.project_team_member.member_role_id"
                                                                    :items="memberRoles"
                                                                    item-text="title"
                                                                    item-value="id"
                                                                    label="Rolle"
                                                                    :readonly="editWindow.memberList.editProjectTeamMemberWindow.readonly"
                                                                    :error="!!editWindow.memberList.editProjectTeamMemberWindow.errors.member_role_id"
                                                                    :error-messages="editWindow.memberList.editProjectTeamMemberWindow.errors.member_role_id"
                                                                ></v-select>
                                                                <v-text-field
                                                                    v-model="editedItem.name"
                                                                    label="AG/Gruppe"
                                                                    readonly
                                                                ></v-text-field>
                                                                <v-select
                                                                    v-if="editProjectTeamMemberNew"
                                                                    v-model="editWindow.memberList.editedProjectTeamMember.project_team_member.member_id"
                                                                    :items="allMembers"
                                                                    item-text="name"
                                                                    item-value="id"
                                                                    label="Person"
                                                                    :readonly="editWindow.memberList.editProjectTeamMemberWindow.readonly"
                                                                    :error="!!editWindow.memberList.editProjectTeamMemberWindow.errors.member_id"
                                                                    :error-messages="editWindow.memberList.editProjectTeamMemberWindow.errors.member_id"
                                                                ></v-select>
                                                                <v-text-field
                                                                    v-if="!editProjectTeamMemberNew"
                                                                    v-model="editWindow.memberList.editedProjectTeamMember.name"
                                                                    label="Person"
                                                                    readonly
                                                                ></v-text-field>
                                                                <v-textarea
                                                                    v-model="editWindow.memberList.editedProjectTeamMember.project_team_member.admin_comments"
                                                                    label="Kommentar"
                                                                    rows="3"
                                                                    auto-grow
                                                                    :readonly="editWindow.memberList.editProjectTeamMemberWindow.readonly"
                                                                    :error="!!editWindow.memberList.editProjectTeamMemberWindow.errors.admin_comments"
                                                                    :error-messages="editWindow.memberList.editProjectTeamMemberWindow.errors.admin_comments"
                                                                ></v-textarea>
                                                            </v-form>
                                                        </v-container>
                                                    </v-card-text>

                                                    <v-card-actions>
                                                        <v-spacer></v-spacer>
                                                        <v-btn
                                                            text
                                                            @click="closeEditProjectTeamMemberWindow"
                                                        >Abbrechen</v-btn>
                                                        <v-btn
                                                            text
                                                            @click="saveEditProjectTeamMemberWindow"
                                                            :loading="editWindow.memberList.editProjectTeamMemberWindow.saveInProgress"
                                                            v-if="!editWindow.memberList.editProjectTeamMemberWindow.readonly"
                                                        >Speichern</v-btn>
                                                    </v-card-actions>
                                                </v-card>
                                            </v-dialog>
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
                            <v-btn
                                text
                                @click="closeEditWindow"
                            >Abbrechen</v-btn>
                            <v-btn
                                text
                                @click="saveEditWindow"
                                :loading="editWindow.saveInProgress"
                                v-if="!editWindow.readonly"
                            >Speichern</v-btn>
                        </v-card-actions>
                    </v-card>
                </v-dialog>
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
                <v-icon
                    small
                    @click.stop="deleteItem(item)"
                    v-if="!strictReadonly"
                >
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
  export default {
    name: "ProjectTeam",
    data () {
      return {
        MUH: true,
        search: '',
        strictReadonly: false,
        searchEditWindow: '',
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
                text: 'Actions',
                value: 'action',
                sortable: false,
                filterable: false,
              },
              {
                text: 'Aktive(r)',
                value: 'name',
              },
              {
                text: 'Funktion',
                value: 'project_team_member.member_role_title',
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
                project_team_id: -1
              },
              name: ""
            },
            defaultProjectTeamMember: {
              project_team_member: {
                admin_comments: "",
                id: -1,
                member_id: -1,
                member_role_id: -1,
                member_role_title: "",
                project_team_id: -1
              },
              name: ""
            }
          }
        },
        alert: {
          shown: false,
          text: "",
          type: "success"
        },
        headers: [
          {
            text: 'Actions',
            value: 'action',
            sortable: false,
            filterable: false,
          },
          {
            text: 'Name',
            value: 'name'
          },
          {
            text: 'E-Mail',
            value: 'email'
          },
          {
            text: '1. Hilfe',
            value: 'needs_first_aid_training',
            filterable: false,
          }
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
          members: []
        },
        defaultItem: {
          id: -1,
          name: "",
          email: "",
          needs_first_aid_training: false,
          description: "",
          comments: "",
          members: []
        },
        memberRoles: [],
      }
    },
    computed: {
      editProjectTeamMemberNew () {
        return (this.editWindow.memberList.editedProjectTeamMemberIndex == -1);
      }
    },
    watch: {
      'editWindow.shown': {
        deep: true,
        handler: function (val) {
          val || this.closeEditWindow();
        },
      },
      'editWindow.memberList.editProjectTeamMemberWindow.shown': {
        deep: true,
        handler: function (val) {
          val || this.closeEditProjectTeamMemberWindow();
        },
      },
      'editedItem.members': {
        deep:true,
        handler: function(val) {
          this.members = val;
        }
      },
    },
    mounted () {
      this.strictReadonly = (sessionStorage.getItem('readonly') == 1);
      this.getProjectTeamsFromApi()
        .then(data => {
          this.projectTeams = data.items;
        });
      this.getMemberRolesFromApi()
        .then(data => {
          this.memberRoles = data.items;
        });
      this.getAllMembersFromApi()
        .then(data => {
          this.allMembers = data.items;
        })
    },
    methods: {
      handleRequestError(error, scope) {
        this.is_logged_in = false;
        if(error.response) {
          console.log(error.response);
          switch (error.response.status) {
            case 401:
              this.$router.push('login');
              break;
            case 422:
              scope.saveInProgress = false;
              scope.errors = error.response.data;
              break;
            default:
              this.showAlert("error", "Unbekannter Fehler");
          }
        } else if(error.request) {
          this.$router.push('login');
        } else {
          this.$router.push('login');
        }
      },
      checkForTrue(val) {
        if (val === true || val == "1" || val == 1) {
          return true;
        }
        else {
          return false;
        }
      },
      getProjectTeamsFromApi() {
        var me = this;
        me.loading = true;

        return new Promise((resolve, reject) => {

          let items = [];

          this.$http.get('/api/project-teams?token=' + sessionStorage.getItem('token'))
            .then(function (response) {
              me.loading = false;
              items = response.data;

              resolve({items});
            })
            .catch(function (error) {
              me.handleRequestError(error);
              reject("Error");
            });
        })
      },
      getMemberRolesFromApi() {
        return new Promise((resolve, reject) => {
          var me = this;

          let items = [];

          this.$http.get('/api/member-roles?token=' + sessionStorage.getItem('token'))
            .then(function (response) {
              items = response.data;

              resolve({items});
            })
            .catch(function (error) {
              me.handleRequestError(error);
              reject("Error");
            });
        })
      },
      getAllMembersFromApi() {
        return new Promise((resolve, reject) => {
          var me = this;

          let items = [];

          this.$http.get('/api/members?token=' + sessionStorage.getItem('token'))
            .then(function (response) {
              items = response.data;

              resolve({items});
            })
            .catch(function (error) {
              me.handleRequestError(error);
              reject("Error");
            });
        })
      },
      showAlert(type, text) {
        this.alert.shown = true;
        this.alert.type = type;
        this.alert.text = text;

        setTimeout(() => {
          this.alert.shown = false;
        }, 5000);
      },
      showItem (item) {
        this.editedIndex = this.projectTeams.indexOf(item);
        this.editWindow.loading = true;
        var projectTeamId = this.projectTeams[this.editedIndex].id;
        var me = this;

        this.$http.get('/api/project-team/' + projectTeamId + '?token=' + sessionStorage.getItem('token'))
          .then(function (response) {
            me.editWindow.loading = false;
            Object.assign(me.projectTeams[me.editedIndex], response.data);
            me.editedItem = Object.assign(item, response.data);
          })
          .catch(function (error) {
            me.handleRequestError(error);
          });
        this.editWindow.shown = true;
      },
      viewItem (item) {
        this.showItem(item);
        this.editWindow.readonly = true;
      },
      editItem (item) {
        this.showItem(item);
        this.editWindow.readonly = this.strictReadonly || false;
      },
      deleteItem (item) {
        var index = this.projectTeams.indexOf(item);
        var me = this;

        if (confirm('Are you sure you want to delete this item?')) {
          var projectTeamId = this.projectTeams[index].id;
          this.$http.delete(
            '/api/project-team/' + projectTeamId + '?token=' + sessionStorage.getItem('token')
          )
            .then(function (response) {
              me.projectTeams.splice(index, 1);

              me.showAlert(
                "success",
                "Gelöscht"
              );
            })
            .catch(function (error) {
              me.handleRequestError(error);
            });
        }
      },
      closeEditWindow () {
        this.editWindow.saveInProgress = false;
        this.editWindow.shown = false;
        this.editWindow.readonly = false;
        setTimeout(() => {
          this.editedItem = Object.assign({}, this.defaultItem);
          this.editWindow.errors = {};
          this.editedIndex = -1
        }, 300);
      },
      closeEditProjectTeamMemberWindow () {
        this.editWindow.memberList.editProjectTeamMemberWindow.saveInProgress = false;
        this.editWindow.memberList.editProjectTeamMemberWindow.shown = false;
        this.editWindow.memberList.editProjectTeamMemberWindow.readonly = false;
        setTimeout(() => {
          this.editedProjectTeamMember = Object.assign({}, this.editWindow.memberList.defaultProjectTeamMember);
          this.editWindow.memberList.editProjectTeamMemberWindow.errors = {};
          this.editedProjectTeamMemberIndex = -1
        }, 300);
      },
      saveEditWindow () {
        this.editWindow.saveInProgress = true;
        var me = this;

        if (this.editedIndex > -1) {
          var projectTeamId = this.editedItem.id;
          this.$http.put(
            '/api/project-team/' + projectTeamId + '?token=' + sessionStorage.getItem('token'),
            this.editedItem
          )
            .then(function (response) {
              Object.assign(me.projectTeams[me.editedIndex], response.data);
              me.closeEditWindow();

              me.showAlert(
                "success",
                "Gespeichert"
              );
            })
            .catch(function (error) {
              me.handleRequestError(error, me.editWindow);
            });
        } else {
          this.$http.post(
            '/api/project-team?token=' + sessionStorage.getItem('token'),
            this.editedItem
          )
            .then(function(response) {
              me.projectTeams.push(response.data);
              me.closeEditWindow();

              me.showAlert(
                "success",
                "Gespeichert"
              );
            })
            .catch(function (error) {
              me.handleRequestError(error, me.editWindow);
            });
        }
      },
      saveEditProjectTeamMemberWindow: function() {
        this.editWindow.memberList.editProjectTeamMemberWindow.saveInProgress = true;
        var me = this;

        if(this.editWindow.memberList.editedProjectTeamMemberIndex > -1) {
          var projectTeamMemberId = this.editWindow.memberList.editedProjectTeamMember.project_team_member.id;
          this.$http.put(
            '/api/project-team-member/' + projectTeamMemberId + '?token=' + sessionStorage.getItem('token'),
            this.editWindow.memberList.editedProjectTeamMember.project_team_member
          )
            .then(function (response) {
              Object.assign(me.members[me.editWindow.memberList.editedProjectTeamMemberIndex].project_team_member, response.data);
              me.closeEditProjectTeamMemberWindow();
            })
            .catch(function (error) {
              me.handleRequestError(error, me.editWindow.memberList.editProjectTeamMemberWindow);
            });
        } else {
          this.editWindow.memberList.editedProjectTeamMember.project_team_member.project_team_id = this.editedItem.id;
          this.$http.post(
            '/api/project-team-member?token=' + sessionStorage.getItem('token'),
            this.editWindow.memberList.editedProjectTeamMember.project_team_member
          )
            .then(function(response) {
              var memberNewId = response.data.member_id;
              var memberNew = me.allMembers.find(member => (member.id == memberNewId));
              memberNew.project_team_member = response.data;

              me.members.push(memberNew);
              me.closeEditProjectTeamMemberWindow();
            })
            .catch(function (error) {
              me.handleRequestError(error, me.editWindow.memberList.editProjectTeamMemberWindow);
            });
        }
      },
      showProjectTeamMemberItem: function(item) {
        this.editWindow.memberList.editedProjectTeamMemberIndex = this.members.indexOf(item);
        this.editWindow.memberList.editProjectTeamMemberWindow.loading = true;

        this.editWindow.memberList.editedProjectTeamMember = Object.assign(this.members[this.editWindow.memberList.editedProjectTeamMemberIndex], item);

        this.editWindow.memberList.editProjectTeamMemberWindow.shown = true;
      },
      viewProjectTeamMemberItem: function(item) {
        this.showProjectTeamMemberItem(item);
        this.editWindow.memberList.editProjectTeamMemberWindow.readonly = true;
      },
      editProjectTeamMemberItem: function(item) {
        this.showProjectTeamMemberItem(item);
        this.editWindow.memberList.editProjectTeamMemberWindow.readonly = this.strictReadonly || false;
      },
      deleteProjectTeamMemberItem: function(item) {
        var index = this.editedItem.members.indexOf(item);
        var me = this;

        if (confirm('Are you sure you want to delete this item?')) {
          var projectTeamMember = this.editedItem.members[index].project_team_member.id;
          this.$http.delete(
            '/api/project-team-member/' + projectTeamMember + '?token=' + sessionStorage.getItem('token')
          )
            .then(function (response) {
              var tmpEditedItem = me.editedItem;
              tmpEditedItem.members.splice(index, 1);

              me.editedItem = Object.assign({}, tmpEditedItem);

              me.showAlert(
                "success",
                "Gelöscht"
              );
            })
            .catch(function (error) {
              me.handleRequestError(error);
            });
        }
      },
    }
  }
</script>