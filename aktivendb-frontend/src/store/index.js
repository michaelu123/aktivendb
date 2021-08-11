import Vue from 'vue'
import Vuex from "vuex";

Vue.use(Vuex);

export default new Vuex.Store(
  {
    state:
      {
        currentUser: null,
        is_logged_in: false
      },
    getters:
      {
        currentUserId: function(state) {
          if (state.currentUser == null) return 0;
          return state.currentUser.member_id;
        }
      },
    mutations:
      {
        logged_in: function(state, user)
        {
          state.currentUser = user;
          state.is_logged_in = (user !== null);
        },
        logged_out: function(state)
        {
          state.currentUser = null;
          state.is_logged_in = false;
        }
      }
  })