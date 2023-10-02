<template>
    <v-content>
        <div v-for="line in historyTxt">
            <p>{{ line }}</p>
        </div>
    </v-content>
</template>

<script>
import { mdiLockAlertOutline, mdiThermometerMinus } from '@mdi/js';
import dataJson from "C:/Users/Michael/VueProjects/aktivendb/aktivendb-frontend/history.json"
export default {
    name: 'history',
    async mounted() {
        console.log("read users");
        let userList = await this.getUsersFromApi();
        for (const u of userList) {
            // console.log("User", u);
            this.users[u.id] = u.email;
        }
        console.log("parse history");
        try {
            for (const line of dataJson) {
                line.record_new = JSON.parse(line.record_new);
                line.record_old = JSON.parse(line.record_old);
            }
        } catch (e) { }
        console.log("filter history");
        let elims = 0;
        let dataJson2 = dataJson.filter(e => {
            return true;
            // for (const prop in e.record_new) {
            //     if (prop.endsWith("_at")) {
            //         if (e.record_new[prop] != null && e.record_old[prop] != null) {
            //             console.log("TZ?", prop, e.record_old[prop], e.record_new[prop]);
            //             continue;
            //         } //normally only different TZ
            //     };
            //     if (e.record_new[prop] != e.record_old[prop]) {
            //         // console.log("diff", prop, e.record_new[prop], e.record_old[prop]);
            //         return true;
            //     }
            // }
            // elims++;
            // return false;
        });
        console.log("elims", elims);
        console.log("read members");
        await this.getMembersFromApi().then((data) => {
            this.members = data.items;
            for (const m of this.members) {
                this.memberNames[m.id] = m.first_name + " " + m.last_name;
            }
        });
        console.log("read teams");
        await this.getProjectTeamsFromApi().then((data) => {
            this.project_teams = data.items;
            for (const t of this.project_teams) {
                this.teamNames[t.id] = t.name;
            }
        });
        console.log("explain history");
        for (const line of dataJson2) {
            this.explainHistory(line);
        }
        console.log("finished");
    },
    data() {
        return {
            members: [],
            memberNames: {},
            project_teams: [],
            teamNames: {
                // deleted records not fetched from API call
                "22": "AG Radfahrschule",
                "29": "AG Leitungen",
                "34": "AG Tagestouren",
                "64": "OG Ismaning Test",
            },
            historyTxt: [],
            users: {},
        };
    },

    components: {
    },
    methods: {
        getMembersFromApi() {
            return new Promise((resolve, reject) => {
                let items = [];
                this.$http
                    .get("/api/members?token=" + sessionStorage.getItem("token"))
                    .then(function (response) {
                        items = response.data;
                        resolve({ items });
                    })
                    .catch(function (error) {
                        console.log("ERROR", error);
                        reject("Error");
                    });
            });
        },
        async getUsersFromApi() {
            try {
                let response = await this.$http.get(
                    "/api/users" + "?token=" + sessionStorage.getItem("token")
                );
                let users = response.data;
                console.log("users", users);
                return users;
            } catch (e) {
                console.log("ERRORUSER1", e);
            }
            // currently above call results in a 500 error
            let users = [];
            for (let id = 1; id < 70; id++) {
                try {
                    let response = await this.$http.get(
                        "/api/user/" + id + "?token=" + sessionStorage.getItem("token")
                    );
                    let user = response.data;
                    users.push(user);
                    // console.log("id", id, "user", user);
                } catch (e) {
                    // console.log("ERRORUSER", id, e);
                }
            }
            return users;
        },
        getProjectTeamsFromApi() {
            return new Promise((resolve, reject) => {
                let items = [];
                this.$http
                    .get("/api/project-teams?token=" + sessionStorage.getItem("token"))
                    .then(function (response) {
                        items = response.data;
                        resolve({ items });
                    })
                    .catch(function (error) {
                        console.log("ERROR", error);
                        reject("Error");
                    });
            });
        },
        explainHistory(line) {
            if (line.reference_table == "members") {
                this.explainMember(line);
            } else if (line.reference_table == "project_team_member") {
                this.explainTeamMember(line);
            } else if (line.reference_table == "project_teams") {
                this.explainTeam(line);
            } else {
                console.log("reference_table???", line.reference_table);
            }
        },
        explainMember(member) {
            let msg = this.users[member.user_id];
            if (Array.isArray(member.record_old)) {
                msg = member.record_new.created_at.substring(0, 10) + " " + msg;
                msg += " adds " + member.record_new.first_name + " " + member.record_new.last_name;
                console.log("Mcreated", member);
            } else if (member.record_old.deleted_at != null && member.record_new.deleted_at != null) {
                msg = member.record_new.deleted_at.substring(0, 10) + " " + msg;
                msg += " deletes " + member.record_new.first_name + " " + member.record_new.last_name;
                console.log("Mdeleted", member);
            } else {
                msg = member.record_new.updated_at.substring(0, 10) + " " + msg;
                msg += " updates " + member.record_new.first_name + " " + member.record_new.last_name + ": ";
                console.log("Mchanged", member);
                for (const prop in member.record_new) {
                    if (prop.endsWith("_at")) continue; //normally only different TZ
                    if (member.record_new[prop] != member.record_old[prop]) {
                        msg += prop + ":" + member.record_old[prop] + "=>" + member.record_new[prop] + " / ";
                        console.log("   diff", prop, member.record_new[prop], member.record_old[prop]);
                    }
                }
            }
            this.historyTxt.push(msg);
        },
        explainTeamMember(tm) {
            let msg = this.users[tm.user_id];
            if (Array.isArray(tm.record_old)) {
                msg = tm.record_new.created_at.substring(0, 10) + " " + msg;
                msg += " adds " + this.memberName(tm.record_new.member_id) + " to " + this.teamName(tm.record_new.project_team_id) + " with role " + tm.record_new.member_role_id;
                console.log("TMcreated", tm);
            } else if (tm.record_old.deleted_at != null && tm.record_new.deleted_at != null) {
                msg = tm.record_new.deleted_at.substring(0, 10) + " " + msg;
                msg += " deletes " + this.memberName(tm.record_new.member_id) + " from " + this.teamName(tm.record_new.project_team_id);
                console.log("TMdeleted", tm);
            } else {
                msg = tm.record_new.updated_at.substring(0, 10) + " " + msg;
                msg += " updates " + this.memberName(tm.record_new.member_id) + " for " + this.teamName(tm.record_new.project_team_id) + ": ";
                console.log("TMchanged", tm);
                for (const prop in tm.record_new) {
                    if (prop.endsWith("_at")) continue; //normally only different TZ
                    if (tm.record_new[prop] != tm.record_old[prop]) {
                        msg += prop + ":" + tm.record_old[prop] + "=>" + tm.record_new[prop] + " / ";
                        console.log("   diff", prop, tm.record_new[prop], tm.record_old[prop]);
                    }
                }
            }
            this.historyTxt.push(msg);
        },
        explainTeam(team) {
            let msg = this.users[team.user_id];
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
            let tn = this.teamNames[id];
            if (!tn) tn = "TeamId " + id;
            return tn;
        },
        memberName(id) {
            let mn = this.memberNames[id];
            if (!mn) mn = "MemberId " + id;
            return mn;
        }
    },
}
</script>
