document.getElementById('downloadLink').addEventListener('click', function() {
    var filename = this.getAttribute('download');
    var fileContent = 
    `
    AutoHub Showroom Terms and Conditions
    1. Introduction
    These Terms and Conditions govern your use of AutoHub Showroom's services and website. By accessing our services or website, you agree to abide by these terms and conditions. If you disagree with any part of these terms and conditions, you may not access our services or website.
    
    2. Vehicle Information
    AutoHub Showroom provides information about various vehicles, including their specifications, features, and prices. We strive to ensure the accuracy of this information, but we do not guarantee its completeness or accuracy. Vehicle prices are subject to change without notice.
    
    3. Vehicle Purchases
    When you purchase a vehicle through AutoHub Showroom, you agree to abide by the terms and conditions set forth in the purchase agreement. This agreement outlines the terms of sale, including the vehicle price, payment terms, warranties, and return policies.
    
    4. Privacy Policy
    AutoHub Showroom respects your privacy and is committed to protecting your personal information. Our Privacy Policy outlines how we collect, use, and protect your information when you use our services or website. By using our services or website, you consent to the terms of our Privacy Policy.
    
    5. Intellectual Property
    The content and materials provided on the AutoHub Showroom website, including text, images, logos, and trademarks, are protected by copyright and other intellectual property laws. You may not use, reproduce, or distribute these materials without our prior written consent.
    
    6. Limitation of Liability
    AutoHub Showroom is not liable for any damages or losses arising from your use of our services or website. We are not responsible for any errors or omissions in the information provided on our website. Your use of our services or website is at your own risk.
    
    7. Governing Law
    These Terms and Conditions are governed by and construed in accordance with the laws of [Your Country]. Any disputes arising out of these terms and conditions will be resolved in the courts of [Your Jurisdiction].
    
    8. Contact Us
    If you have any questions or concerns about these terms and conditions, please contact us at [Contact Information].
    `;
    var blob = new Blob([fileContent], { type: 'text/plain' });

    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
});


let submitBtn = document.querySelector("#submit-button");
let checkbox = document.querySelector("#checkbox");
checkbox.addEventListener('change', function() {
    if (this.checked) {
        console.log('Checkbox is checked');
        submitBtn.style.opacity = "1";
        submitBtn.style.cursor = "pointer";
    } else {
        console.log('Checkbox is not checked');
        submitBtn.style.opacity = "0.5";
        submitBtn.style.cursor = "not-allowed";
    }
});