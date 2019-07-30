const input = document.getElementById("specfinder");

const div = document.createElement('div');

const specDiv = document.getElementById("specs");
const specTemplate = document.getElementById("spec").innerHTML;


fetch("spec-data.json").then(r => r.json())
  .then(data => {
    new Awesomplete(input, {
      list: Object.keys(data).map(k => {
        return {label: data[k].label, value: k};
      }),
      // insert label instead of value into the input.
      replace: function(suggestion) {
	this.input.value = suggestion.label;
      },
      // limit to matches at the start of the string
      filter: function (text, input) {
        const m = text.match(
          new RegExp(input.trim()
                     // escape regexp-y characters
                     .replace(/[-\\^$*+?.()|[\]{}]/g, "\\$&"), "i")
        );
	return m && m.index === 0;
      },
      maxItems: 30
    });
    input.addEventListener("awesomplete-selectcomplete", function(e) {
      specDiv.innerHTML = "";
      const intro = document.createElement("p");
      intro.innerHTML = data[e.text.value].labelHTML;
      intro.appendChild(document.createTextNode(" defined in:"));
      specDiv.appendChild(intro);

      data[e.text.value].specs.forEach(s => {
        const p = document.createElement("p");
        p.innerHTML = specTemplate;
        p.querySelector("a.spec").href = s.url;
        p.querySelector("a.spec").textContent = s.title;
        if (s.repo) {
          p.querySelector("a.repo").textContent = s.repo.owner + "/" + s.repo.name;
          p.querySelector("a.repo").href = "https://github.com/" + s.repo.owner + "/" + s.repo.name;
        }
        specDiv.appendChild(p);
      });
    });
  });

