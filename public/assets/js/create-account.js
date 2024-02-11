let pass = document.getElementById("pass");
let repeatPass = document.getElementById("repeatPass");
let myForm = document.querySelector("#myForm");
let submitBtn = document.querySelector("#submit-button");
let warning = document.getElementById("warning");

submitBtn.addEventListener("click", (event) => {
    event.preventDefault();

    console.log(pass.value, repeatPass.value);
    if (pass.value === repeatPass.value) {
        myForm.submit();
    } else {
        warning.hidden = false;
    }
});
