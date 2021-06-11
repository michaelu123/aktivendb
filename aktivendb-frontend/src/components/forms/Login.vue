<template>
    <v-container
        class="fill-height"
        fluid
    >
        <v-card class="elevation-12 mx-auto" min-width="420px">
            <v-card-text>
                <v-form @submit.prevent="login">
                    <div class="text-center mb-4">
                        <h3 class="font-weight-regular">Aktivenverwaltung</h3>
                        <h6 class="mb-3 font-weight-regular">Log-in</h6>
                    </div>

                    <div class="alert alert-warning" v-if="infoError">{{ error }}</div>

                    <v-text-field
                        v-model="email"
                        label="E-Mail"
                        required
                    ></v-text-field>
                    <v-text-field
                        v-model="password"
                        label="Passwort"
                        type="password"
                        required
                    ></v-text-field>

                    <v-btn
                        type="submit"
                        block
                        outlined
                        color="primary"
                        :loading="loading"
                        :disabled="loading"
                    >
                        Login
                    </v-btn>
                </v-form>
            </v-card-text>
        </v-card>
    </v-container>
</template>

<script>
  export default {
    name: "Login",
    data: function()
    {
      return {
        infoError: false,
        email: 'admin@aktivendb.adfc-muenchen.de',
        password: '',
        token: '',
        error: '',
        loading: false
      }
    },
    mounted: function()
    {
      if (this.$route.name == "logout") {
        this.logout();
      }
    },
    methods:
      {
        login() {
          this.infoError = false;
          this.token = '';
          this.error = '';
          var me = this;

          this.loading = true;

          this.$http.post('/auth/login',
            {
              email: this.email,
              password: this.password
            })
            .then(function(response)
            {
              var data = response.data;
              sessionStorage.setItem('token', data.token);
              sessionStorage.setItem('readonly', data.user.readonly);
              me.$store.commit('logged_in', data.user);
              me.$router.push('/');
            })
            .catch(function(error)
            {
              me.loading = false;
              if(error.response) {
                var data = error.response.data;
                me.infoError = true;
                me.error = data.error;
              } else if(error.request) {
                console.log(error.request);
              } else {
                console.log(error);
              }
            })
        },
        logout() {
          this.infoError = false;
          var me = this;

          this.loading = true;

          this.$http.post('/auth/logout',
            {
              token: sessionStorage.getItem('token')
            })
            .then(function(response)
            {
              var data = response.data;
              sessionStorage.removeItem('token');
              sessionStorage.removeItem('readonly');
              me.$store.commit('logged_out');
              me.$router.push('/');
            })
            .catch(function(error)
            {
              me.loading = false;
              if(error.response) {
                var data = error.response.data;
                me.infoError = true;
                if(data) {
                  me.error = data.error;
                }
              } else if(error.request) {
                console.log(error.request);
              } else {
                console.log(error);
              }
            })
        }
      }
  }
</script>

<style scoped>

</style>