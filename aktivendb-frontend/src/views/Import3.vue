<!--
  Habe ich gebraucht, um die AG Tagestouren auf die AGs TT Tourenrad, Mountainbike, Rennrad aufzuteilen..
-->
<template>
  <v-content>
    <v-file-input
      label="Wähle eine Excel-Datei (AG TT Format)"
      placeholder="Eine Excel-Datei mit Aktiven"
      accept=".xlsx"
      v-model="excelFile"
    >
    </v-file-input>
    <v-btn v-if="excelFileSet" @click="importFile">Import </v-btn>
  </v-content>
</template>

<script>
// see https://stackoverflow.com/questions/5402949/mysql-cant-make-column-auto-increment

import readXlsxFile from "read-excel-file";

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
  reference: null, // ??
  latest_first_aid_training: null,
  gender: null,
  latest_contact: null,
  active: 1,
  user: null,
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
const colNamesMap = {
  "Name, Vorname": "name",
  G: "gender",
  Festnetz: "phone_primary",
  Mobil: "phone_secondary",
  Email: "EMAIL",
  Tourenrad: "+AG TT Tourenrad",
  Rennrad: "+AG TT Rennrad",
  Mountainbike: "+AG TT Mountainbike",
  Mehrtagestouren: "+AG Mehrtagestouren",
};

export default {
  data() {
    return { excelFile: [], members: [], allAGs: [], adfcId: -9999 }; // TODO XXX = select max(adfc_id) from members;
  },
  computed: {
    excelFileSet() {
      return this.excelFile.length != 0;
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
      readXlsxFile(this.excelFile).then(async (rows) => {
        console.log("len", rows.length);
        colNames = rows[0];
        await this.storeMembers(rows);
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

    matches(n, name) {
      let nr = n.replaceAll(" ", "").replaceAll(",", "").replaceAll("v.", "");
      console.log("match", name, ":", nr, nr === name);
      return nr === name;
    },

    async storeMembers(rows) {
      for (let rowx = 1; rowx < rows.length; rowx++) {
        const row = rows[rowx];
        const name = row[0];
        if (!name || name.startsWith("Name,")) continue;
        let x = this.members.findIndex((m) => m.name === name);
        if (x == -1) {
          let nr = name
            .replaceAll(" ", "")
            .replaceAll(",", "")
            .replaceAll("v.", "");
          x = this.members.findIndex((m) => this.matches(m.name, nr));
          if (x == -1) {
            console.log("Notfound ", nr);
          }
        }
        let exi = x >= 0 ? this.members[x] : null;
        let member = this.mapRow(row, exi);
        console.log("Member:", member.name, member.id, member.project_teams);
        if (!member.email_private || member.email_private == "")
          member.email_private = "x@y.de";
        if (!member.email_adfc || member.email_adfc == "")
          member.email_adfc = "x@y.de";
        // await this.storeMember(member);

        let exiMember = await this.getMemberFromApi(member.id);
        let exiAGs = exiMember.project_teams;
        for (let agName of member.project_teams) {
          if (exiAGs.findIndex((p) => p.name == agName) >= 0) continue;
          let agMember = { ...nullAGMember };
          agMember.member_id = member.id;
          let ag = this.allAGs.find((ag) => ag.name === agName);
          agMember.project_team_id = ag.id;
          await this.storeAGMember(agMember);
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

    async storeAG(ag) {
      await this.$http
        .post("/api/project-team?token=" + sessionStorage.getItem("token"), ag)
        .then(async function (response) {
          console.log(response);
          ag.id = response.data.id;
        })
        .catch(async function (error) {
          console.log(error);
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

    mapRow(row, exi) {
      let member = exi == null ? { ...nullMember } : { ...exi };
      if (member.project_teams == null) member.project_teams = [];
      if (member.adfc_id == null) member.adfc_id = this.adfcId++;
      for (let i = 0; i < colNames.length; i++) {
        let colName = colNames[i];
        let dbColName = colNamesMap[colName];
        let val = row[i];
        if (val == null || val === "") continue;
        if (dbColName == null) continue;
        if (dbColName[0] == "+") {
          let agName = dbColName.substring(1);
          member.project_teams.push(agName);
          if (agName.substring(0, 5) == "AG TT") {
            member.project_teams.push("AG Tagestouren");
          }
          continue;
        }
        if (dbColName == "EMAIL") {
          if (val.toLowerCase().includes("adfc-muenchen.de")) {
            member.email_adfc = val;
          } else {
            member.email_private = val;
          }
          continue;
        }
        console.log("colName", colName, "dbColName", dbColName, "val", val);
        member[dbColName] = val;
      }
      console.log("member", member);
      return member;
    },
  },
};
</script>
