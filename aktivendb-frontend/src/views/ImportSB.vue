// Used to import results of Serienbrief. Export from Google Sheet as Excel-file, then open with this code
// Am 06.09.22 bis Burhenne Roman 246 importiert

<template>
  <v-content>
    <v-file-input
      label="Wähle eine Excel-Datei"
      placeholder="Eine Excel-Datei mit den Resultaten der Aktiven-Befragung per Serienbrief"
      accept=".xlsx"
      v-model="excelFile"
    >
    </v-file-input>

    <v-select
      v-model="phase"
      :items="phases"
      item-text="Phase"
      item-value="id"
      label="Phase"
      required 
    ></v-select>

    <v-btn v-if="excelFileAndPhaseSet" @click="importFile">Import </v-btn>

    <v-textarea v-if="messagesSet"
      v-model="message"
      label="Ergebnis"
      rows="10"
      no-resize
    ></v-textarea>


</v-content>
</template>

<script>
// see https://stackoverflow.com/questions/5402949/mysql-cant-make-column-auto-increment

import readXlsxFile from "read-excel-file";



// Phase 1: check that names in DB and Excel file match
// Phase 2: delete members that don't want to be stored
// Phase 3: update members and their AGs

const nullMember = {
  id: null,
  name: "",
  email_adfc: null,
  email_private: null,
  phone_primary: null,
  phone_secondary: null,
  address: null,
  adfc_id: null,
  admin_comments: null,
  reference: "", // ??
  latest_first_aid_training: null,
  gender: null,
  interests: null,
  latest_contact: null,
  active: 1,
  birthday: "",
  status: "",
  registered_for_first_aid_training: 0,
  first_name: "",
  last_name: "",
  project_teams: [],
};

const nullAGMember = {
  admin_comments: null,
  id: null,
  member_id: null,
  member_role_id: 2, // no role in excel
  member_role_title: "Mitglied",
  project_team_id: null,
};

let colNames = [];
let colNamesIdx = {};
const colNamesMap = {
  "Nachname": "last_name",
  "Vorname": "first_name",
  "Geschlecht": "gender",
  "Geburtsjahr": "birthday",
  "Postleitzahl": "address",
  "ADFC Email-Adresse": "email_adfc",
  "Eigene Email-Adresse": "email_private",
  "Telefonnummer 1": "phone_primary",
  "Telefonnummer 2": "phone_secondary",
  "AGs": "AGs",
  "Interessen": "interests",
  "ADFC-Mitgliedsnummer": "adfc_id",
  "Letztes Erste-Hilfe-Training": "latest_first_aid_training",
  "Registriert für ein Erste-Hilfe-Training?": "registered_for_first_aid_training",
  "Mit Speicherung einverstanden?": "daccord",
  "Aktives Mitglied?": "active"
};

const emailRegexp = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;

export default {
  data() {
    return { 
      excelFile: [], 
      members: [], 
      allAGs: [], 
      phase: "",
      phases: ["Namen überprüfen", "Widersprechende löschen", "Ändern oder Neuanlegen"],
      message: ""
    }; 
  },
  computed: {
    excelFileAndPhaseSet() {
      return this.excelFile.length != 0 && this.phase != "";
    },
    messagesSet() {
      return this.message != "";
    },
  },
  async mounted() {
    await this.getMembersFromApi().then((data) => {
      this.members = data.items;
    });
    await this.getAllAGsFromApi().then((data) => {
      this.allAGs = data.items;
    });
    console.log("mounted", this.allAGs, this.members);
  },
  methods: {
    async importFile() {
      console.log("excelFile", this.excelFile);
      readXlsxFile(this.excelFile)
      .then(async (rows) => {
        console.log("len", rows.length);
        colNames = rows[0];
        for (let i = 0; i < colNames.length; i++) {
          colNamesIdx[colNames[i]] = i;
        }
        await this.storeMembers(rows);
      })
      .catch(function (error) {
            console.log("ERROR", error);
      });
    },
    getMembersFromApi() {
      console.log("MUH getMembersFromApi");
      return new Promise((resolve, reject) => {
        let items = [];
        this.$http
          .get("/api/members?token=" + sessionStorage.getItem("token"))
          .then(function (response) {
            console.log("getMembersFromApi2", response.data);
            items = response.data;
            resolve({ items });
          })
          .catch(function (error) {
            console.log("ERROR", error);
            reject("Error");
          });
      });
    },
    getAllAGsFromApi() {
      console.log("MUHP getProjectTeamsFromApi");
      return new Promise((resolve, reject) => {
        let items = [];
        this.$http
          .get("/api/project-teams?token=" + sessionStorage.getItem("token"))
          .then(function (response) {
            console.log("getProjectTeamsFromApi2", response.data);
            items = response.data;
            resolve({ items });
          })
          .catch(function (error) {
            console.log("ERROR", error);
            reject("Error");
          });
      });
    },

    async getMemberFromApi(id) {
      let response = await this.$http.get(
        "/api/member/" + id + "?token=" + sessionStorage.getItem("token")
      );
      let member = response.data;
      console.log("getMemberFromApi", member);
      return member;
    },

    nameOf(row) {
      return row[colNamesIdx["Nachname"]].trim() + ", " + row[colNamesIdx["Vorname"]].trim();
    },

    async storeMembers(rows) {
      let phase = this.phases.findIndex(x => x == this.phase) + 1;
      this.message = ""
      if (phase < 1 || phase > 3) {
        console.log("phase invalid", this.phase);
        return;
      }
      console.log("phase", this.phase, phase);
      for (let rowx = 1; rowx < rows.length; rowx++) {
        const row = rows[rowx];
        const vorname = row[colNamesIdx["Vorname"]].trim();
        const nachname = row[colNamesIdx["Nachname"]].trim();
        let x = this.members.findIndex((m) => m.first_name.trim() === vorname && m.last_name.trim() === nachname);
        if (x == -1) {
          if (row[colNamesIdx["Mit Speicherung einverstanden?"]] == "Nein") {
            this.message += "Gelöscht wird: " + this.nameOf(row) + "\n"
            continue;
          }
          console.log("unknown or new", this.nameOf(row));
          this.message += "Unbekannt oder neu: " + this.nameOf(row) + "\n";
         }
        if (phase == 1) continue;  // first make sure all names in DB and Excel match
        if (phase == 2) { // delete member if storage not wanted
          if (x != -1 && row[colNamesIdx["Mit Speicherung einverstanden?"]] == "Nein") {
            await this.deleteMember(row, x);
            this.message += "Gelöscht: " + this.nameOf(row) + "\n"
          }
          continue;
        }
        let exi = x == -1 ? null : this.members[x];
        let member = this.mapRow(row, exi);
        console.log(
          "Member:",
          member.name,
          member.id,
          member.project_teams,
          member.interests
        );
        if (member.id == null) {
          this.message += "Neu angelegt: " + this.nameOf(row) + "\n"
        } else {
          this.message += "Geändert: " + this.nameOf(row) + "\n"
        }
        await this.storeMember(member);
        // now we get the member again, but this time with project_teams
        let exiMember = await this.getMemberFromApi(member.id);
        let exiAGs = exiMember.project_teams;
        for (let agName of member.project_teams) {
          if (exiAGs.findIndex((p) => p.name == agName) >= 0) continue;
          let agMember = { ...nullAGMember };
          agMember.member_id = member.id;
          let ag = this.allAGs.find((ag) => ag.name === agName);
          agMember.project_team_id = ag.id;
          console.log("add member ", this.nameOf(row), "to", ag.name, ag.id);
          await this.storeAGMember(agMember);
        }

        for (let team of exiMember.project_teams) {
          let agName = team.name;
          if (member.project_teams.findIndex((name) => name == agName) == -1) {
            let tm = team.project_team_member;
            console.log("deleteAGMember", this.nameOf(row), "from", agName, tm.id);
            await this.deleteAGMember(tm.id);
          }
        }
      }
    },

    async storeMember(member) {
      if (member.id == null) {
        await this.$http
          .post("/api/member?token=" + sessionStorage.getItem("token"), member)
          .then(async function (response) {
            console.log(response);
            member.id = response.data.id;
          })
          .catch(async function (error) {
            console.log(error);
          });
      } else {
        await this.$http
          .put(
            "/api/member/" +
              member.id +
              "?token=" +
              sessionStorage.getItem("token"),
            member
          )
          .then(async function (response) {
            console.log(response);
            member.id = response.data.id;
          })
          .catch(async function (error) {
            console.log(error);
          });
      }
    },

    async deleteMember(row, index) {
      var memberId = this.members[index].id;
      console.log("delete", this.nameOf(row), memberId);
      this.$http
        .delete(
          "/api/member/" +
            memberId +
            "?token=" +
            sessionStorage.getItem("token")
        )
        .then(function (_) {
          this.members.splice(index, 1);
        })
        .catch(function (error) {
          console.log("delete failed", this.nameOf(row), error);
        });
    },


    async storeAGMember(agMember) {
      await this.$http
        .post(
          "/api/project-team-member?token=" + sessionStorage.getItem("token"),
          agMember
        )
        .then(async function (response) {
          console.log(response);
          agMember.id = response.data.id;
        })
        .catch(async function (error) {
          console.log(error);
        });
    },

    deleteAGMember: function (projectTeamMemberId) {
      var me = this;

      me.$http
        .delete(
          "/api/project-team-member/" +
            projectTeamMemberId +
            "?token=" +
            sessionStorage.getItem("token")
        )
        .then(function (_response) {
          console.log("deleteAGMember success", projectTeamMemberId);
        })
        .catch(function (error) {
          console.log("deleteAGMember error", error, projectTeamMemberId);
        });
    },

    mapRow(row, exi) {
      nullMember.project_teams = []
      let member = exi == null ? { ...nullMember } : { ...exi };
      if (member.project_teams == null) member.project_teams = [];

      for (let i = 0; i < colNames.length; i++) {
        let colName = colNames[i];
        let dbColName = colNamesMap[colName];
        if (dbColName == null) continue;
        let val = row[i];
        if (dbColName.startsWith("email_") && (val == null || val === "")) val = "undef@undef.de";
        if (val == null || val === "") continue;
        if (colName == "AGs") {
          for (let ag of this.allAGs) {
            if (val.indexOf(ag.name) >= 0) {
              member.project_teams.push(ag.name);
            }
          }
        } else if (dbColName == "active") {
          member[dbColName] = val == "Nein" ? 0 : 1;
        } else if (dbColName == "registered_for_first_aid_training") {
          member[dbColName] = val.toLowerCase().startsWith("ja") ? 1 : 0;
        } else if (dbColName.startsWith("email_")) {
          val = val.toLowerCase(val);
          let m = val.match(emailRegexp);
          if (!m || m[0] != val) { 
            console.log("invalid email",val);
            val = "";
          }
          member[dbColName] = val;
        } else {
          if (typeof(val) == "string") val = val.trim();
          member[dbColName] = val;
        }
      }
      member["name"] = this.nameOf(row);
      console.log("member", member);
      return member;
    },
  },
};
</script>
