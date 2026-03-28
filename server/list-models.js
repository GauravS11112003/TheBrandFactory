const key = "AIzaSyCjkDiMQuqFixqHU3DqNRL46eq52_eBsyk";
fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`)
  .then(res => res.json())
  .then(data => {
    console.log("Returned data:");
    if (data.models) {
      console.log(data.models.map(m => m.name).join("\n"));
    } else {
      console.log(JSON.stringify(data, null, 2));
    }
  })
  .catch(console.error);
