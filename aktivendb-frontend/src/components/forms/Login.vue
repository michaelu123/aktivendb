<template>
  <v-container class="fill-height" fluid>
    <v-card class="elevation-12 mx-auto" min-width="420px">
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
      <v-card-text>
        <v-form @submit.prevent="login(true)">
          <div class="text-center mb-4">
            <h3 class="font-weight-regular">Aktivenverwaltung</h3>
            <h6 class="mb-3 font-weight-regular">Log-in</h6>
          </div>

          <div class="alert alert-warning" v-if="infoError">{{ error }}</div>

          <v-text-field v-model="email" label="E-Mail" required></v-text-field>
          <v-text-field
            v-if="!chgPasswd"
            :append-icon="showPwd1 ? 'mdi-eye' : 'mdi-eye-off'"
            :type="showPwd1 ? 'text' : 'password'"
            @click:append="showPwd1 = !showPwd1"
            v-model="password"
            label="Passwort"
            required
          ></v-text-field>
          <v-text-field
            v-if="chgPasswd"
            :append-icon="showPwd2 ? 'mdi-eye' : 'mdi-eye-off'"
            :type="showPwd2 ? 'text' : 'password'"
            @click:append="showPwd2 = !showPwd2"
            autocomplete="password"
            v-model="password"
            label="Altes Passwort"
            required
          ></v-text-field>
          <v-text-field
            v-if="chgPasswd"
            :append-icon="showPwd3 ? 'mdi-eye' : 'mdi-eye-off'"
            :type="showPwd3 ? 'text' : 'password'"
            @click:append="showPwd3 = !showPwd3"
            autocomplete="new-password"
            v-model="newPasswd1"
            label="Neues Passwort"
            required
          ></v-text-field>
          <v-text-field
            v-if="chgPasswd"
            :append-icon="showPwd4 ? 'mdi-eye' : 'mdi-eye-off'"
            :type="showPwd4 ? 'text' : 'password'"
            @click:append="showPwd4 = !showPwd4"
            autocomplete="new-password"
            v-model="newPasswd2"
            label="Neues Passwort wiederholen"
            required
          ></v-text-field>

          <v-btn
            class="my-5"
            type="submit"
            block
            outlined
            color="primary"
            :loading="loading"
            :disabled="loading"
          >
            Login
          </v-btn>

          <v-btn
            class="my-5"
            @click.prevent="chgPasswd = !chgPasswd"
            type="submit"
            block
            outlined
            color="primary"
            :loading="loading"
            :disabled="loading"
          >
            {{ chgPasswd ? "Passwort nicht ändern" : "Passwort ändern" }}
          </v-btn>

          <v-btn
            class="my-5"
            v-if="chgPasswd"
            @click.prevent="changePasswd"
            type="submit"
            block
            outlined
            color="primary"
            :loading="loading"
            :disabled="loading"
          >
            Passwort jetzt ändern
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script>
export default {
  name: "Login",
  data: function () {
    return {
      infoError: false,
      email: "",
      password: "",
      token: "",
      error: "",
      chgPasswd: false,
      showPwd1: false,
      showPwd2: false,
      showPwd3: false,
      showPwd4: false,
      newPasswd1: "",
      newPasswd2: "",
      loading: false,
      alert: {
        shown: false,
        text: "",
        type: "success",
      },
    };
  },
  mounted: function () {
    this.password = this.newPasswd1 = this.newPasswd2 = "";
    if (this.$route.name == "logout") {
      this.logout();
    }
  },
  methods: {
    async login(pushIfSucc) {
      this.infoError = false;
      this.token = "";
      this.error = "";
      var me = this;
      this.loading = true;
      sessionStorage.setItem("email", "");
      try {
        var response = await me.$http.post("/auth/login", {
          email: this.email,
          password: this.password,
        });
        var loginData = response.data;
        console.log("logindata", loginData);
        sessionStorage.setItem("token", loginData.token);
        sessionStorage.setItem("readonly", loginData.user.readonly);
        sessionStorage.setItem("is_admin", loginData.user.is_admin);
        sessionStorage.setItem("email", this.email);
        me.$store.commit("logged_in", loginData.user);
        if (pushIfSucc) {
          me.$router.push("/");
        }
      } catch (error) {
        me.loading = false;
        if (error.response) {
          var errorData = error.response.data;
          me.infoError = true;
          me.error = errorData.error;
        } else if (error.request) {
          console.log("error6", error.request);
        } else {
          console.log("error7", error);
        }
      }
    },
    logout() {
      this.infoError = false;
      var me = this;

      this.loading = true;

      this.$http
        .post("/auth/logout", {
          token: sessionStorage.getItem("token"),
        })
        .then(function (response) {
          var data = response.data;
          sessionStorage.removeItem("token");
          sessionStorage.removeItem("readonly");
          me.$store.commit("logged_out");
          me.$router.push("/");
        })
        .catch(function (error) {
          me.loading = false;
          if (error.response) {
            var data = error.response.data;
            me.infoError = true;
            if (data) {
              me.error = data.error;
            }
          } else if (error.request) {
            console.log("error8", error.request);
          } else {
            console.log("error9", error);
          }
        });
    },
    async changePasswd() {
      var me = this;
      if (me.password == "" || me.newPasswd1 == "" || me.newPasswd2 == "") {
        me.showAlert("error", "Bitte Passwörter angeben");
        return;
      }
      if (me.newPasswd1 != me.newPasswd2) {
        me.showAlert("error", "Passwörter stimmen nicht überein");
        return;
      }
      if (this.email == "") {
        me.showAlert("error", "Bitte Email-Adresse angeben");
        return;
      }
      await this.login(false);

      var newPasswd = {
        password_old: this.password,
        password_new: this.newPasswd1,
        password_conf: this.newPasswd2,
      };
      try {
        var response = await me.$http.post(
          "/auth/change_password?token=" + sessionStorage.getItem("token"),
          newPasswd
        );
        me.showAlert("success", "Passwort geändert");
        me.loading = false;
        me.chgPasswd = false;
        me.password = me.newPasswd1;
      } catch (error) {
        me.showAlert("error", "Fehler");
      }
    },
    showAlert(type, text) {
      this.alert.shown = true;
      this.alert.type = type;
      this.alert.text = text;

      setTimeout(() => {
        this.alert.shown = false;
        this.loading = false;
      }, 5000);
    },
  },
};
</script>

<style scoped></style>
