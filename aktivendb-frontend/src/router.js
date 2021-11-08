import Vue from "vue";
import Router from "vue-router";
import Home from "@/views/Home.vue";
import Member from "@/views/Member.vue";
import ProjectTeam from "@/views/ProjectTeam.vue";
import Login from "@/components/forms/Login.vue";
/* 
import Import1 from "@/views/Import1.vue";
import Import2 from "@/views/Import2.vue";
import Import3 from "@/views/Import3.vue";
*/
Vue.use(Router)

export default new Router({
  base: process.env.BASE_URL ,
  routes: [
    {
      name: 'home',
      path: '/',
      component: Home
    },
    {
      name: 'login',
      path: '/login',
      component: Login
    },
    {
      name: 'logout',
      path: '/logout',
      component: Login
    },
    {
      name: 'members',
      path: '/members/:id?/:user?',
      component: Member,
      props: true
    },
    {
      name: 'project_teams',
      path: '/project_teams/:id?',
      component: ProjectTeam,
      props: true,
    },
/*  {
      name: "import1",
      path: "/import1",
      component: Import1,
    },
    {
      name: "import2",
      path: "/import2",
      component: Import2,
    },
    {
      name: "import3",
      path: "/import3",
      component: Import3,
    },
*/
/*
    {
      name: 'project_team_member_detail',
      path: '/project_team_members/d/:project_team_id?/:member_id?',
      component: ProjectTeamMembers,
      props: true
    },
    {
      name: 'project_team_members',
      path: '/project_team_members/:entity?/:entity_id?',
      component: ProjectTeamMembers,
      props: true
    }
*/
/*  {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      // component: () => import(/!* webpackChunkName: "about" *!/ '@/views/About.vue')
      component: About
    }
*/
  ],
});
