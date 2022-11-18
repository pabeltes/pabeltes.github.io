document.getElementById("name").value = localStorage.name;
document.getElementById("age").value = localStorage.age;
document.getElementById("height").value = localStorage.height;
document.getElementById("weight").value = localStorage.weight / 9.8;
document.getElementById("betis").value = localStorage.betis * 100;
document.getElementById("jenis-gerakan").value = localStorage.jenisGerakan;

document.getElementById(localStorage.gender).checked = true;

const registerForm = document.querySelector("#register-form");

registerForm.addEventListener("submit", (e) => {
  e.preventDefault();

  localStorage.auth = "true";
  localStorage.name = registerForm["name"].value;
  localStorage.age = registerForm["age"].value;
  localStorage.height = registerForm["height"].value;
  localStorage.weight = registerForm["weight"].value * 9.8;
  localStorage.betis = registerForm["betis"].value / 100;
  localStorage.jenisGerakan = registerForm["jenis-gerakan"].value;

  var gender = document.getElementsByName("gender");

  for (var i = 0, length = gender.length; i < length; i++) {
    if (gender[i].checked) {
      // do whatever you want with the checked radio
      localStorage.gender = gender[i].value;

      // only one radio can be logically checked, don't check the rest
      break;
    }
  }
  window.location.replace("index.html");
});
