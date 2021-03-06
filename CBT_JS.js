// Basic - Selenium Example Script
// see https://github.com/SeleniumHQ/selenium/wiki/WebDriverJs for details
// runs test against http://crossbrowsertesting.github.io/selenium_example_page.html

var webdriver = require('selenium-webdriver');
var SeleniumServer = require('selenium-webdriver/remote').SeleniumServer;
var request = require('request');
var remoteHub = 'http://hub.crossbrowsertesting.com:80/wd/hub';
var assert = require('assert')

var username = 'william.pratt@smartbear.com'; //replace with your email address 
var authkey = 'AUTHKEY'; //replace with your authkey 

var caps = {
    'browserName': 'Safari',
    'deviceName': 'iPhone 12 Pro Max',
    'platformVersion': '14.0',
    'platformName': 'iOS',
    'deviceOrientation': 'portrait',
    'record_video': 'true'
};

caps.username = 'william.pratt@smartbear.com';
caps.password = 'PASSWORD';

var sessionId = null;


console.log('Connection to the CrossBrowserTesting remote server');
async function full(){
    try{
    var driver = new webdriver.Builder()
                .usingServer(remoteHub)
                .withCapabilities(caps)
                .build();


    console.log('Waiting on the browser to be launched and the session to start');

    await driver.getSession().then(function(session){
        sessionId = session.id_; //need for API calls
        console.log('Session ID: ', sessionId); 
        console.log('See your test run at: https://app.crossbrowsertesting.com/selenium/' + sessionId)
    });

    //load your URL
    await driver.get('http://crossbrowsertesting.github.io/selenium_example_page.html');

    await driver.findElement(webdriver.By.xpath("/html/body/div/form/input[1]")).sendKeys("William");

    await driver.findElement(webdriver.By.xpath("/html/body/div/form/input[2]")).click();

    await driver.findElement(webdriver.By.xpath("/html/body/div/form/select/option[3]")).click();

    await driver.findElement(webdriver.By.xpath("/html/body/div/form/input[4]")).click();

    await driver.findElement(webdriver.By.xpath("/html/body/div/form/textarea")).sendKeys("Pratt");

    await driver.findElement(webdriver.By.xpath("/html/body/div/form/input[5]")).click();

    await driver.findElement(webdriver.By.xpath('/html/body/div/div[5]/button[1]')).click();



    //take snapshot via cbt api
    await driver.takeSnapshot();
    
    //check title
    await driver.getTitle().then(function(title){
        console.log('page title is ', title);
        assert.equal(title, 'Selenium Test Example Page');
    });


    //quit the driver
    await driver.quit()

    //set the score as passing
    setScore('pass').then(function(result){
        console.log('SUCCESS! set score to pass')
    });
    }
    catch(e){
        webdriverErrorHandler(e, driver)
    }
   
}

full();


//Call API to set the score
function setScore(score){
    return new Promise((resolve, fulfill)=> {
    var result = { error: false, message: null }

    if (sessionId){
        
        request({
            method: 'PUT',
            uri: 'https://crossbrowsertesting.com/api/v3/selenium/' + sessionId,
            body: {'action': 'set_score', 'score': score },
            json: true
        },
        function(error, response, body) {
            if (error) {
                result.error = true;
                result.message = error;
            }
            else if (response.statusCode !== 200){
                result.error = true;
                result.message = body;
            }
            else{
                result.error = false;
                result.message = 'success';
            }
        })
        .auth(username, authkey);
    }
    else{
        result.error = true;
        result.message = 'Session Id was not defined';
        deferred.fulfill(result);
    }

    
        result.error ? fulfill('Fail') : resolve('Pass');
    });
}

//Call API to get a snapshot 
webdriver.WebDriver.prototype.takeSnapshot = function() {

    return new Promise((resolve, fulfill)=> { 
        var result = { error: false, message: null }
        
        if (sessionId){
            request.post(
                'https://crossbrowsertesting.com/api/v3/selenium/' + sessionId + '/snapshots', 
                function(error, response, body) {
                    if (error) {
                        result.error = true;
                        result.message = error;
                    }
                    else if (response.statusCode !== 200){
                        result.error = true;
                        result.message = body;
                    }
                    else{
                        result.error = false;
                        result.message = 'success';
                    }
                }
            )
            .auth(username,authkey);
            
        }
        else{
            result.error = true;
            result.message = 'Session Id was not defined';
           
        }

            result.error ? fulfill('Fail') : resolve('Pass'); //never call reject as we don't need this to actually stop the test
    });
}

//general error catching function
function webdriverErrorHandler(err, driver){

    console.error('There was an unhandled exception! ' + err.message);

    //if we had a session, end it and mark failed
    if (driver && sessionId){
        driver.quit();
        setScore('fail').then(function(result){
            console.log('FAILURE! set score to fail')
        })
    }
}
