// Used to import results of Serienbrief. Export from Google Sheet as Excel-file, then open with this code
// npm run serve
// URL http://localhost:8236/app/index.html#/importSB

// Am 20.03.23 bis Witte 244 importiert
// Am 4.4.23 Christoph Rouette 245 händisch importiert
// Am 1.5.23 Rosa Bieger 246 händisch importiert
// Am 23.5.23 Heitler und Frey, bis 248 importiert
// am 30.5.23 Schröder, Jens, bis 249 importiert
// am 14.6.23 Schulz, Cornelia händisch importiert
// am 21.6. bis Dürholz, 253 importiert
// am 20.7. bis Höcher 255 importiert
// am 29.9.23 bis Kloppmann 256 importiert (mit Testlauf)

<template>
  <v-content>
    <v-file-input label="Wähle eine Excel-Datei"
      placeholder="Eine Excel-Datei mit den Resultaten der Aktiven-Befragung per Serienbrief" accept=".xlsx"
      v-model="excelFile">
    </v-file-input>

    <v-select v-model="phase" :items="phases" item-text="Phase" item-value="id" label="Phase" required></v-select>

    <v-btn v-if="excelFileAndPhaseSet" @click="importFile">Import </v-btn>

    <v-textarea v-if="messagesSet" v-model="message" label="Ergebnis" rows="10" no-resize></v-textarea>


  </v-content>
</template>

<script>
// see https://stackoverflow.com/questions/5402949/mysql-cant-make-column-auto-increment

import readXlsxFile, { parseExcelDate } from "read-excel-file";



// Phase 1: check that names in DB and Excel file match
// Phase 2: delete members that don't want to be stored
// Phase 3: log what would be changed but don't change DB
// Phase 4: update members and their AGs

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
  next_first_aid_training: null,
  gender: null,
  interests: null,
  latest_contact: null,
  active: 1,
  birthday: "",
  status: "",
  registered_for_first_aid_training: 0,
  responded_to_questionaire: 1,
  responded_to_questionaire_at: null,
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
  "Nächstes Erste-Hilfe-Training": "next_first_aid_training",
  "Registriert für ein Erste-Hilfe-Training?": "registered_for_first_aid_training",
  "Mit Speicherung einverstanden?": "daccord",
  "Aktives Mitglied?": "active",
  "Zeitstempel": "responded_to_questionaire_at",
};

const emailRegexp = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;

export default {
  data() {
    return {
      excelFile: [],
      members: [],
      allAGs: [],
      phase: "",
      phases: ["Namen überprüfen", "Widersprechende löschen", "Testlauf", "Ändern oder Neuanlegen"],
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
          // cannot read "Zeitstempel" from xlsx file, it returns a number, that can be converted to a date, which is then off by some 13 hours.
          // I took two timestamps, got a diff as number (0.5192341087968089), computed the number of secs between the timestamps (44862),
          // and multiplied this by 13*60*60 sec . No idea what this is all about.
          let rlen = rows.length;
          console.log("len", rows.length);
          let corr = 13.0 * 60.0 * 60.0 * 0.5192341087968089 / 44862.0;
          console.log("Corr", corr);
          for (let row = 1; row < rlen; row++) {
            let x = rows[row][0];
            let t = parseExcelDate(x - corr);
            let d = t.toISOString(t);
            d = d.substring(0, 10);
            // console.log(rows[row][1], "Z", z);
            rows[row][0] = d;
          }

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
      console.log("getMembersFromApi");
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
      console.log("getProjectTeamsFromApi");
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
      this.message = "";
      if (phase < 1 || phase > 4) {
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
            this.message += "Schon gelöscht wurde: " + this.nameOf(row) + "\n";
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
        if (member.changed && phase == 4) {
          await this.storeMember(member);
        }
        // now we get the member again, but this time with project_teams
        let exiMember = await this.getMemberFromApi(member.id);
        let exiAGs = exiMember.project_teams;
        for (let agName of member.project_teams) {
          if (exiAGs.findIndex((p) => p.name == agName) >= 0) continue;
          let agMember = { ...nullAGMember };
          agMember.member_id = member.id;
          let ag = this.allAGs.find((ag) => ag.name === agName);
          agMember.project_team_id = ag.id;
          this.message += "Mitglied: " + this.nameOf(row) + " möchte der " + ag.name + " beitreten\n";
          console.log(this.nameOf(row), "wants to be added to", ag.name);
          // await this.storeAGMember(agMember);  // nicht mehr, soll der AG-Leiter machen
        }

        for (let team of exiMember.project_teams) {
          let agName = team.name;
          if (member.project_teams.findIndex((name) => name == agName) == -1) {
            let tm = team.project_team_member;
            this.message += "Mitglied: " + this.nameOf(row) + " tritt aus der " + agName + " aus\n";
            if (phase == 4) {
              await this.deleteAGMember(tm.id);
              console.log(this.nameOf(row), "was deleted from", agName);
            }
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
      let me = this;
      this.$http
        .delete(
          "/api/member/" +
          memberId +
          "?token=" +
          sessionStorage.getItem("token")
        )
        .then(function () {
          me.members.splice(index, 1);
        })
        .catch(function (error) {
          console.log("delete failed", me.nameOf(row), error);
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
        .then(function () {
          console.log("deleteAGMember success", projectTeamMemberId);
        })
        .catch(function (error) {
          console.log("deleteAGMember error", error, projectTeamMemberId);
        });
    },

    mapRow(row, exi) {
      nullMember.project_teams = []
      let member = exi == null ? { ...nullMember } : { ...exi };
      let savedMember = { ...member };
      member.responded_to_questionaire = 1;
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
            console.log("invalid email", val);
            val = "";
          }
          member[dbColName] = val;
        } else {
          if (typeof (val) == "string") val = val.trim();
          member[dbColName] = val;
        }
      }
      member["name"] = this.nameOf(row);
      member.latest_first_aid_training = this.date2String(member.latest_first_aid_training);
      member.next_first_aid_training = this.date2String(member.next_first_aid_training);
      member.latest_contact = this.date2String(member.latest_contact);
      member.changed = this.logDiffs(member, savedMember, exi) != null;
      return member;
    },

    date2String(t) {
      let latestEHK = null;
      if (t) {
        if (typeof t == "string") {
          latestEHK = t;
        } else {
          latestEHK = t.toISOString().substring(0, 10);
        }
      }
      return latestEHK;
    },

    logDiffs(member, prev, exi) {
      let msg = "";
      if (member.email_adfc != prev.email_adfc) msg += "email_adfc:" + prev.email_adfc + "=>" + member.email_adfc + " ";
      if (member.email_private != prev.email_private) msg += "email_private:" + prev.email_private + "=>" + member.email_private + " ";
      if (member.phone_primary != prev.phone_primary) msg += "phone_primary:" + prev.phone_primary + "=>" + member.phone_primary + " ";
      if (member.phone_secondary != prev.phone_secondary) msg += "phone_secondary:" + prev.phone_secondary + "=>" + member.phone_secondary + " ";
      if (member.address != prev.address) msg += "address:" + prev.address + "=>" + member.address + " ";
      if (member.gender != prev.gender) msg += "gender:" + prev.gender + "=>" + member.gender + " ";
      if (member.birthday != prev.birthday) msg += "birthday:" + prev.birthday + "=>" + member.birthday + " ";
      if (member.interests != prev.interests) msg += "interests:" + prev.interests + "=>" + member.interests + " ";
      if (member.adfc_id != prev.adfc_id) msg += "adfc_id:" + prev.adfc_id + "=>" + member.adfc_id + " ";
      if (member.active != prev.active) msg += "active:" + prev.active + "=>" + member.active + " ";

      console.log(msg);
      if (exi == null) {
        if (member.latest_first_aid_training) {
          console.log("New member", member.name, "wants as EHK-Date", member.latest_first_aid_training);
          this.message += "Neues Mitglied möchte als EHK-Datum " + member.latest_first_aid_training + "\n";
          member.latest_first_aid_training = null;
        }
      } else {
        if (member.latest_first_aid_training && member.latest_first_aid_training != exi.latest_first_aid_training) {
          this.message += "Mitglied: " + member.name + " möchte das EHK-Datum von " + exi.latest_first_aid_training + " auf " + member.latest_first_aid_training + " ändern\n";
          console.log("Member:", member.name, "wants to change EHK date from ", exi.latest_first_aid_training, "to", member.latest_first_aid_training);
          member.latest_first_aid_training = exi.latest_first_aid_training;
        }
      }
      if (msg == "") return null;
      msg = exi == null ? "New " : "Existing " + "Member:" + member.name + ": " + msg;

      this.message += msg + "\n";
      return msg;
    }
  },

};
</script>
