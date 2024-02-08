let pass = document.getElementById("pass");
let repeatPass = document.getElementById("repeatPass");
let myForm = document.querySelector("#myForm");
let submitBtn = document.querySelector("#submit-button");
let warning = document.getElementById("warning");

submitBtn.addEventListener("click",()=>{
    if(pass.textContent===repeatPass.textContent)
    myForm.submit();
    else{
        warning.hidden = false;
    }
});
