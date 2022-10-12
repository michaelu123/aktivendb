function toDate(t) {
    let d;
    if (t == null) {
        d = null; 
    } else {
        let y = parseInt(t.substring(0, 4));
        let m = parseInt(t.substring(5, 7));
        let dy = parseInt(t.substring(8, 10));
        d = new Date(y, m - 1, dy, 6);
    }
    return d;
}

function makeSchema(me) {
    return [
      /*
        {
            column: "Name",
            type: String,
            value: (member) => member.name,
            width: 30,
        },
        */
      {
        column: "Nachname",
        type: String,
        value: (member) => member.last_name,
        width: 30,
      },
      {
        column: "Vorname",
        type: String,
        value: (member) => member.first_name,
        width: 30,
      },
      {
        column: "Geschlecht",
        type: String,
        value: (member) => member.gender,
        width: 10,
      },
      {
        column: "Geburtsjahr",
        type: String,
        value: (member) => member.birthday,
        width: 12,
      },
      {
        column: "Postleitzahl",
        type: String,
        value: (member) => member.address,
        width: 12,
      },
      {
        column: "ADFC-Mitgliedsnummer",
        type: Number,
        value: (member) =>
          member.adfc_id == null ? null : parseInt(member.adfc_id),
        width: 22,
      },
      {
        column: "Email-ADFC",
        type: String,
        value: (member) => member.email_adfc,
        width: 30,
      },
      {
        column: "Email-Privat",
        type: String,
        value: (member) => member.email_private,
        width: 30,
      },
      {
        column: "Email",
        type: String,
        value: function(member) {
          let email = "";
          if (me.preferredEmail.endsWith("ADFC")) {
            email =
              member.email_adfc != ""
                ? member.email_adfc
                : member.email_private;
          } else {
            email =
              member.email_private != ""
                ? member.email_private
                : member.email_adfc;
          }
          return email;
        },
        width: 30,
      },
      {
        column: "Telefon",
        type: String,
        value: (member) => member.phone_primary,
        width: 20,
      },
      {
        column: "Telefon-Alternative",
        type: String,
        value: (member) => member.phone_secondary,
        width: 20,
      },
      {
        column: "AGs",
        type: String,
        value: (member) => member.ags,
        width: 30,
      },
      {
        column: "Interessen",
        type: String,
        value: (member) => member.interests,
        width: 30,
      },
      {
        column: "Letztes Erste-Hilfe-Training",
        type: Date,
        format: "yyyy-mm-dd",
        value: function(member) {
          let t = member.latest_first_aid_training;
          return toDate(t);
        },
        width: 15,
      },
      {
        column: "Nächstes Erste-Hilfe-Training",
        type: Date,
        format: "yyyy-mm-dd",
        value: function(member) {
          let t = member.next_first_aid_training;
          return toDate(t);
        },
        width: 15,
      },
      {
        column: "Registriert für Erste-Hilfe-Training",
        type: Boolean,
        value: (member) => member.registered_for_first_aid_training == "1",
        width: 15,
      },
      {
        column: "Fragebogen ausgefüllt",
        type: Boolean,
        value: (member) => member.responded_to_questionaire == "1",
        width: 15,
      },
      {
        column: "Datum Fragebogen",
        type: Date,
        format: "yyyy-mm-dd",
        value: function(member) {
          let t = member.responded_to_questionaire_at;
          return toDate(t);
        },
        width: 15,
      },
      {
        column: "Aktiv",
        type: Boolean,
        value: (member) => member.active == "1",
        width: 15,
      },
    ];
}

export default makeSchema;