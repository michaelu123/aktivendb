<template>
    <v-dialog v-model="history.shown">
        <v-card>
            <v-card-title>
                History
            </v-card-title>
            <v-card-text>
                <div v-for="line in historyTxt" :key="line">
                    <p>{{ line }}</p>
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

import dataJson from "C:/Users/Michael/VueProjects/aktivendb/aktivendb-frontend/history.json"
let users = {};
let memberNames = {};
let teamNames = {
    // deleted records not fetched from API call
    "31": "Test",
    "38": "Test",
    "44": "Test",
    "22": "AG Radfahrschule",
    "29": "AG Leitungen",
    "34": "AG Tagestouren",
    "64": "OG Ismaning Test",
};

function parse(data) {
    if (typeof data.record_new !== "string") return data;
    try {
        data.record_new = JSON.parse(data.record_new);
        data.record_old = JSON.parse(data.record_old);
        for (const prop in data) {
            if (prop.endsWith("_id")) {
                data[prop] = +data[prop];
            }
        }
        for (const prop in data.record_new) {
            if (prop.endsWith("_id")) {
                data.record_new[prop] = +data.record_new[prop];
            }
        }
        for (const prop in data.record_old) {
            if (prop.endsWith("_id")) {
                data.record_old[prop] = +data.record_old[prop];
            }
        }
        // eslint-disable-next-line no-empty
    } catch (e) { }
    return data;
}

export default {
    name: 'history',
    props: ["history", "members", "projectTeams"],
    async mounted() {
        for (const t of this.projectTeams) {
            teamNames[t.id] = t.name;
        }
        for (const m of this.members) {
            memberNames[m.id] = m.last_name + ", " + m.first_name;
        }

        console.log("read history", this.history.id);
        // let dataH = await this.getHistoryFromApi(this.history.table, this.history.id);
        let dataH = [];
        for (let data of dataJson) {
            data = parse(data);
            if (this.history.table == data.reference_table && +data.reference_id == this.history.id) {
                dataH.push(parse(data));
            } else if (data.reference_table == "project_team_member") {
                if (this.history.table == "members" && +data.record_new.member_id == this.history.id) {
                    dataH.push(data);
                }
                if (this.history.table == "project_teams" && +data.record_new.project_team_id == this.history.id) {
                    dataH.push(data);
                }
            }
        }

        console.log("explain history");
        for (const event of dataH) {
            let email = (await this.getUserFromApi(event.user_id)).email;
            this.explainHistory(event, email);
        }
        console.log("finished");
    },
    data() {
        return {
            historyTxt: [],
        };
    },
    components: {
    },
    methods: {
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
            let user = users[id];
            if (user != null) return user;
            try {
                let response = await this.$http.get(
                    "/api/user/" + id + "?token=" + sessionStorage.getItem("token")
                );
                user = response.data;
                users[id] = user;
                console.log("id", id, "user", user);
            } catch (e) {
                console.log("ERRORUSER2", id, e);
            }
            return user;
        },
        explainHistory(event, email) {
            // event = parse(event);
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
            let msg = email;
            let name = member.record_new["name"];
            if (name == null) name = "";
            name = name.trim();
            if (name == "") {
                name = member.record_new.last_name + ", " + member.record_new.first_name;
                name = name.trim();
            }
            if (Array.isArray(member.record_old)) {
                msg = member.record_new.created_at.substring(0, 10) + " " + msg;
                msg += " adds " + name;
            } else if (member.record_old.deleted_at != null && member.record_new.deleted_at != null) {
                msg = member.record_new.deleted_at.substring(0, 10) + " " + msg;
                msg += " deletes " + name;
            } else {
                let upd = "";
                for (const prop in member.record_new) {
                    if (prop.endsWith("_at")) continue; //normally only different TZ
                    if (member.record_new[prop] != member.record_old[prop]) {
                        upd += prop + ":" + member.record_old[prop] + "=>" + member.record_new[prop] + " / ";
                        // console.log("   diff", prop, member.record_new[prop], member.record_old[prop]);
                    }
                }
                if (upd == "") return;
                msg = member.record_new.updated_at.substring(0, 10) + " " + msg;
                msg += " updates " + name + ": " + upd;
            }
            this.historyTxt.push(msg);
        },
        explainTeamMember(tm, email) {
            if (tm.record_new.project_team_id <= 0) return;
            const teamName = this.teamName(tm.record_new.project_team_id);
            if (teamName.toLowerCase().startsWith("test")) return;
            const memberName = this.memberName(tm.record_new.member_id);
            let msg = email;
            if (Array.isArray(tm.record_old)) {
                msg = tm.record_new.created_at.substring(0, 10) + " " + msg;
                msg += " adds " + memberName + " to " + teamName + " with role " + tm.record_new.member_role_id;
            } else if (tm.record_old.deleted_at != null && tm.record_new.deleted_at != null) {
                msg = tm.record_new.deleted_at.substring(0, 10) + " " + msg;
                msg += " deletes " + memberName + " from " + teamName;
            } else {
                let upd = "";
                for (const prop in tm.record_new) {
                    if (prop.endsWith("_at")) continue; //normally only different TZ
                    if (tm.record_new[prop] != tm.record_old[prop]) {
                        upd += prop + ":" + tm.record_old[prop] + "=>" + tm.record_new[prop] + " / ";
                    }
                }
                if (upd == "") return;
                msg = tm.record_new.updated_at.substring(0, 10) + " " + msg;
                msg += " updates " + memberName + " for " + teamName + ": " + upd;
            }
            this.historyTxt.push(msg);
        },
        explainTeam(team, email) {
            let msg = email;
            if (Array.isArray(team.record_old)) {
                msg = team.record_new.created_at.substring(0, 10) + " " + msg;
                msg += " adds " + team.record_new.name;
                console.log("Tcreated", team);
            } else if (team.record_old.deleted_at != null && team.record_new.deleted_at != null) {
                msg = team.record_new.deleted_at.substring(0, 10) + " " + msg;
                msg += " deletes " + team.record_new.name;
                console.log("Tdeleted", team);
            } else {
                msg = team.record_new.updated_at.substring(0, 10) + " " + msg;
                msg += " updates " + team.record_new.name + ": ";
                console.log("Tchanged", team);
                for (const prop in team.record_new) {
                    if (prop.endsWith("_at")) continue; //normally only different TZ
                    if (team.record_new[prop] != team.record_old[prop]) {
                        msg += prop + ":" + team.record_old[prop] + "=>" + team.record_new[prop] + " / ";
                        console.log("   diff", prop, team.record_new[prop], team.record_old[prop]);
                    }
                }
            }
            this.historyTxt.push(msg);
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
