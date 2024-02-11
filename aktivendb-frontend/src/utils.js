function parse(data) {
  if (typeof data.record_new !== "string") return data;
  try {
    data.record_new = JSON.parse(data.record_new);
    data.record_old = JSON.parse(data.record_old);
    for (const prop in data) {
      if (prop.endsWith("_id")) {
        data[prop] = data[prop].toString();
      }
    }
    for (const prop in data.record_new) {
      if (prop.endsWith("_id")) {
        data.record_new[prop] = data.record_new[prop].toString();
      }
    }
    for (const prop in data.record_old) {
      if (prop.endsWith("_id")) {
        data.record_old[prop] = data.record_old[prop].toString();
      }
    }
    // eslint-disable-next-line no-empty
  } catch (e) {}
  return data;
}

export { parse };
