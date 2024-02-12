<template>
    <v-container>
        <h1>History</h1>
        <v-row>
            <v-menu v-model="showBeginDatePicker" :close-on-content-click="false" :nudge-right="40"
                transition="scale-transition" offset-y min-width="290px">
                <template v-slot:activator="{ on }">
                    <v-text-field v-model="beginDate" label="Beginn" prepend-icon="event" readonly v-on="on"
                        :error="!!errors.beginDate" :error-messages="errors.beginDate"></v-text-field>
                </template>
                <v-date-picker v-model="beginDate" @input="showBeginDatePicker = false" locale="de-de"
                    :max="today"></v-date-picker>
            </v-menu>
            <v-menu v-model="showEndDatePicker" :close-on-content-click="false" :nudge-right="40"
                transition="scale-transition" offset-y min-width="290px">
                <template v-slot:activator="{ on }">
                    <v-text-field v-model="endDate" label="Ende" prepend-icon="event" readonly v-on="on"
                        :error="!!errors.endDate" :error-messages="errors.endDate"></v-text-field>
                </template>
                <v-date-picker v-model="endDate" @input="showEndDatePicker = false" locale="de-de"
                    :max="today"></v-date-picker>
            </v-menu>
            <v-btn @click.prevent="show">Zeige</v-btn>
        </v-row>
        <HistoryDialog v-if="history.shown" :projectTeams="projectTeams" :members="members" :history="history" />
    </v-container>
</template>

<script>
import HistoryDialog from "../components/HistoryDialog.vue"
import dataJson from "C:/Users/Michael/VueProjects/aktivendb/aktivendb-frontend/history.json"
import { parse } from "../utils.js"

export default {
    name: 'HistoryView',
    components: { HistoryDialog },
    data() {
        return {
            members: [],
            projectTeams: [],
            showBeginDatePicker: false,
            showEndDatePicker: false,
            beginDate: null,
            endDate: null,
            history: {
                shown: false,
                id: null,
                table: "members",
                dataH: [],
            },
            errors: {},
        };
    },
    computed: {
        today() {
            return new Date().toISOString().substring(0, 10);
        },
    },
    async mounted() {
        this.endDate = this.today;
        this.members = await this.getAllMembersFromApi();
        this.projectTeams = await this.getAllProjectTeamsFromApi();
    },
    methods: {
        async getAllMembersFromApi() {
            let response = await this.$http.get(
                "/api/members?token=" + sessionStorage.getItem("token")
            );
            return response.data;
        },
        async getAllProjectTeamsFromApi() {
            let response = await this.$http.get(
                "/api/project-teams?token=" + sessionStorage.getItem("token")
            );
            return response.data;
        },

        async show() {
            console.log("read history", this.history.id);
            let dataH = [];
            for (let data of dataJson) {
                const updated = data.updated_at;
                if (updated >= this.beginDate && updated <= this.endDate) {
                    data = parse(data);
                    dataH.push(data);
                }
            }
            this.history.dataH = dataH;
            this.history.shown = true;
            console.log("finished");
        },
    },

}

</script>
