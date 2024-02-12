<template>
    <v-dialog v-model="history.shown">
        <v-card>
            <v-card-title>
                History
                <v-spacer></v-spacer>
                <v-btn @click.prevent="alsText = !alsText">{{ alsText ? "Als Tabelle" : "Als Text" }}</v-btn>
            </v-card-title>
            <v-data-table v-if="!alsText" :headers="headers" :items="historyArray" :search="search" show-expand
                single-expand item-key="key">
                <template v-slot:top>
                    <v-text-field v-model="search" label="Suchen" append-icon="search" single-line hide-details
                        class="ml-2"></v-text-field>
                </template>
                <template v-slot:expanded-item="{ headers, item }">
                    <td :colspan="headers.length">
                        <table>
                            <tr>
                                <th>Feld</th>
                                <th>Alt</th>
                                <th>Neu</th>
                            </tr>
                            <tr v-for="(change, index) in item.changes" :key="index">
                                <td>{{ change.propName }}</td>
                                <td>{{ change.propOld }}</td>
                                <td>{{ change.propNew }}</td>

                            </tr>
                        </table>
                    </td>
                </template>
                <template v-slot:item.data-table-expand="{ item, expand, isExpanded }">
                    <v-btn height="30" v-if="item.changes" @click.prevent="expand(!isExpanded)">
                        <v-icon small>expand</v-icon>
                    </v-btn>
                </template>
            </v-data-table>

            <v-card-text v-if="alsText">
                <div v-for="line in historyTxt" :key="line.lineNo">
                    <p class="mb-0" v-if="line.indent == 0">{{ line.msg }}</p>
                    <p class="mb-0 ml-10" v-if="line.indent != 0">{{ line.msg }}</p>
                </div>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn text @click="closeH">Schließen</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
import { parse } from "../utils.js"

let users = {};
let memberNames = {};
let teamNames = {
    // deleted records not fetched from API call
    "22": "AG Radfahrschule",
    "29": "AG Leitungen",
    "30": "Test AG",
    "31": "Test",
    "32": "Test",
    "33": "Test ML",
    "34": "AG Tagestouren",
    "36": "test",
    "37": "Test",
    "38": "Test",
    "44": "Test",
    "63": "TEST2",
    "64": "OG Ismaning Test",
};
let lineNo = 0;

export default {
    name: 'history',
    props: ["history", "members", "projectTeams"],
    async mounted() {
        for (const t of this.projectTeams) {
            teamNames[t.id.toString()] = t.name;
        }
        for (const m of this.members) {
            memberNames[m.id.toString()] = m.last_name + ", " + m.first_name;
        }

        let dataH;
        if (this.history.id != null) {
            console.log("read history", this.history.id);
            dataH = await this.getHistoryFromApi(this.history.table, this.history.id);
        } else {
            dataH = this.history.dataH;
        }
        console.log("explain history");
        lineNo = 0;
        for (const event of dataH) {
            let email = (await this.getUserFromApi(event.user_id)).email;
            this.explainHistory(event, email);
            lineNo++;
        }
        console.log("finished");
    },
    data() {
        return {
            alsText: false,
            historyTxt: [],
            historyArray: [],
            search: "",
            headers: [
                {
                    text: "Wann",
                    value: "when",
                    sortable: true,
                    filterable: true,
                    // width: "100px",
                },
                {
                    text: "Wer",
                    value: "who",
                    sortable: true,
                    filterable: true,
                },
                {
                    text: "Was",
                    value: "what",
                    sortable: true,
                    filterable: true,
                },
                {
                    text: "Mitglied",
                    value: "whom",
                    sortable: true,
                    filterable: true,
                },
                {
                    text: "Gliederung",
                    value: "where",
                    sortable: true,
                    filterable: true,
                },
                {
                    text: 'Änderungen',
                    value: 'data-table-expand',
                },
            ],
        };
    },
    components: {
    },
    methods: {
        logge(obj) {
            console.log("obj", obj);
            return obj;
        },
        async getHistoryFromApi(table, id) {
            try {
                let response = await this.$http.get(
                    `/api/history/${table}/${id}?token=${sessionStorage.getItem("token")}`
                );
                let data = response.data;
                return data;
            }
            catch (e) {
                return [];
            }
        },
        async getUserFromApi(id) {
            id = id.toString();
            let user = users[id];
            if (user != null) return user;
            try {
                let response = await this.$http.get(
                    "/api/user/" + id + "?token=" + sessionStorage.getItem("token")
                );
                user = response.data;
                users[id] = user;
            } catch (e) {
                console.log("ERRORUSER2", id, e);
            }
            return user;
        },
        explainHistory(event, email) {
            event = parse(event);
            if (event.reference_table == "members") {
                this.explainMember(event, email);
            } else if (event.reference_table == "project_team_member") {
                this.explainTeamMember(event, email);
            } else if (event.reference_table == "project_teams") {
                this.explainTeam(event, email);
            } else {
                console.log("reference_table???", event.reference_table);
            }
        },
        explainMember(member, email) {
            let upd = [];
            let historyObj = {};
            let msg = email;
            historyObj["who"] = email.replace("@adfc-muenchen.de", "");
            historyObj["key"] = lineNo;
            let name = member.record_new["name"];
            if (name == null) name = "";
            name = name.trim();
            if (name == "") {
                name = member.record_new.last_name + ", " + member.record_new.first_name;
                name = name.trim();
            }
            historyObj["whom"] = name;
            if (Array.isArray(member.record_old)) {
                msg = member.record_new.created_at + " " + msg;
                msg += " adds " + name;
                historyObj["what"] = "fügt hinzu";
                historyObj["when"] = member.record_new.created_at;
            } else if (member.record_old.deleted_at != null && member.record_new.deleted_at != null) {
                msg = member.record_new.deleted_at + " " + msg;
                msg += " deletes " + name;
                historyObj["what"] = "löscht";
                historyObj["when"] = member.record_new.deleted_at;
            } else {
                let changesArray = [];
                historyObj["what"] = "ändert";
                historyObj["changes"] = changesArray;
                for (const propName in member.record_new) {
                    if (propName.endsWith("_at")) continue; //normally only different TZ
                    let propNew = member.record_new[propName];
                    let propOld = member.record_old[propName];
                    if (propNew != propOld) {
                        upd.push(propName + ":" + propOld + "=>" + propNew);
                        changesArray.push({ propName, propOld, propNew });
                    }
                }
            }
            if (upd.length == 0) return;
            msg = member.record_new.updated_at + " " + msg + " updates " + name + ": ";
            historyObj["when"] = member.record_new.updated_at;

            this.historyTxt.push({ indent: 0, msg, lineNo });
            for (let u of upd) {
                lineNo++;
                this.historyTxt.push({ indent: 1, msg: u, lineNo: lineNo });
            }
            this.historyArray.push(historyObj);
        },
        explainTeamMember(tm, email) {
            const projTeamId = tm.record_new.project_team_id;
            if (!projTeamId || +projTeamId <= 0) return;
            const teamName = this.teamName(projTeamId);
            if (teamName.toLowerCase().startsWith("test")) return;
            const memberName = this.memberName(tm.record_new.member_id);
            let upd = [];
            let historyObj = {};
            let msg = email;
            historyObj["who"] = email;
            historyObj["whom"] = memberName;
            historyObj["where"] = teamName;
            historyObj["key"] = lineNo;
            if (Array.isArray(tm.record_old)) {
                msg = tm.record_new.created_at + " " + msg;
                msg += " adds " + memberName + " to " + teamName + " with role " + tm.record_new.member_role_id;
                historyObj["what"] = "fügt hinzu";
                historyObj["with"] = "role " + tm.record_new.member_role_id;
                historyObj["when"] = tm.record_new.created_at;
            } else if (tm.record_old.deleted_at != null && tm.record_new.deleted_at != null) {
                msg = tm.record_new.deleted_at + " " + msg;
                msg += " deletes " + memberName + " from " + teamName;
                historyObj["what"] = "löscht";
                historyObj["when"] = tm.record_new.deleted_at;
            } else {
                let changesArray = [];
                historyObj["what"] = "ändert";
                historyObj["changes"] = changesArray;
                for (const propName in tm.record_new) {
                    if (propName.endsWith("_at")) continue; //normally only different TZ
                    let propNew = tm.record_new[propName];
                    let propOld = tm.record_old[propName];
                    if (propNew != propOld) {
                        upd.push(propName + ":" + propOld + "=>" + propNew);
                        changesArray.push({ propName, propOld, propNew });
                    }
                }
                if (upd.length == 0) return;
                msg = tm.record_new.updated_at + " " + msg + " updates " + memberName + " for " + teamName + ": ";
                historyObj["when"] = tm.record_new.updated_at;
            }
            this.historyTxt.push({ indent: 0, msg, lineNo });
            for (let u of upd) {
                lineNo++;
                this.historyTxt.push({ indent: 1, msg: u, lineNo: lineNo });
            }
            this.historyArray.push(historyObj);
        },
        explainTeam(team, email) {
            let upd = [];
            let historyObj = {};
            let msg = email;
            let teamName = team.record_new.name;
            historyObj["who"] = email;
            historyObj["whom"] = teamName;
            historyObj["key"] = lineNo;
            if (Array.isArray(team.record_old)) {
                msg = team.record_new.created_at + " " + msg;
                msg += " adds " + teamName;
                historyObj["what"] = "fügt hinzu";
                historyObj["when"] = team.record_new.created_at;
            } else if (team.record_old.deleted_at != null && team.record_new.deleted_at != null) {
                msg = team.record_new.deleted_at + " " + msg;
                msg += " deletes " + teamName;
                historyObj["what"] = "löscht";
                historyObj["when"] = team.record_new.deleted_at;
            } else {
                let changesArray = [];
                historyObj["what"] = "ändert";
                historyObj["changes"] = changesArray;
                for (const propName in team.record_new) {
                    if (propName.endsWith("_at")) continue; //normally only different TZ
                    let propNew = team.record_new[propName];
                    let propOld = team.record_old[propName];
                    if (propNew != propOld) {
                        upd.push(propName + ":" + propOld + "=>" + propNew);
                        changesArray.push({ propName, propOld, propNew });
                    }
                }
                if (upd.length == 0) return;
                msg = team.record_new.updated_at + " " + msg;
                msg += " updates " + teamName + ": ";
                historyObj["when"] = team.record_new.updated_at;
            }
            this.historyTxt.push({ indent: 0, msg, lineNo });
            for (let u of upd) {
                lineNo++;
                this.historyTxt.push({ indent: 1, msg: u, lineNo: lineNo });
            }
            this.historyArray.push(historyObj);
        },
        teamName(id) {
            let tn = teamNames[id];
            if (!tn) tn = "TeamId " + id;
            return tn;
        },
        memberName(id) {
            let mn = memberNames[id];
            if (!mn) mn = "MemberId " + id;
            return mn;
        },
        closeH() {
            this.history.shown = false;
        },
    },
}
</script>
