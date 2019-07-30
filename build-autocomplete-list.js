var escapeHTML = require('escape-html');

const crawl = require("../reffy-reports/whatwg/crawl.json").results;
const specInfo = require("../spec-dashboard/spec-list.json");
const tokens = {};

function findCssKeywordInValueSpace(valuespace) {
  let ret = [];
  if (Array.isArray(valuespace)) {
    valuespace.forEach(v => ret = ret.concat(findCssKeywordInValueSpace(v)));
  } else if (typeof valuespace === 'object') {
    if (valuespace.type === 'keyword') {
      ret.push(valuespace.name);
    } else {
      Object.values(valuespace).forEach(v => ret = ret.concat(findCssKeywordInValueSpace(v)));
    }
  }
  return [...new Set(ret)];
}

function mapTokenToSpec(s, t, namespace, readableType, context = "") {
  const name = namespace + "-" + t;
  const url = s.edDraft || s.url;
  if (!tokens[name]) {
    tokens[name] = { label: t  + " (" + readableType + context + ")", specs: [], labelHTML: "<code>" + escapeHTML(t) + "</code> (" + readableType + (context ? "<code>" + escapeHTML(context) + "</code>" : "") + ")"};
  }
  if (!specInfo[url] || !specInfo[url].repo) {
    // console.warn("No github repo known for " + url);
  }
  if (!tokens[name].specs.find(s => s.url === url)) {
    tokens[name].specs.push({title: s.title, url , repo: (specInfo[url] || {}).repo });
  }
}

crawl.forEach(s => {
  if (s.idl && s.idl.idlNames) {
    Object.values(s.idl.idlNames).concat(...Object.values(s.idl.idlExtendedNames))
      .filter(idl => idl.type && idl.type === "interface")
      .forEach(idl => {
        mapTokenToSpec(s, idl.name, "idl", "JS interface");
        (idl.members || []).filter(m => m.type === "operation" && m.name)
          .forEach(o => mapTokenToSpec(s, o.name, "idl-op-" + idl.name, "method on ", idl.name));
        (idl.members || []).filter(m => m.type === "attribute")
          .forEach(o => mapTokenToSpec(s, o.name, "idl-attr-" + idl.name, "attribute on ", idl.name));
      });
  }
  if (s.idl && s.idl.jsNames && s.idl.jsNames.constructors) {
    Object.keys(s.idl.jsNames.constructors)
      .forEach(global => s.idl.jsNames.constructors[global].forEach(
        n => mapTokenToSpec(s, n, "idl-constructor-" + global, "JS constructor in ", global))
              );
  }

  if (s.css && s.css.properties) {
    Object.keys(s.css.properties).forEach(t => mapTokenToSpec(s, t, "css-prop", "CSS Property"));
  }
  if (s.css && s.css.valuespaces) {
    Object.keys(s.css.valuespaces).forEach(space => {
      const cssValues = findCssKeywordInValueSpace(s.css.valuespaces[space].parsedValue);
      cssValues.forEach(t => mapTokenToSpec(s, t, "css-val-" + space, "CSS keyword in ", space));
    });
  }
});
console.log(JSON.stringify(tokens, null, 2));
