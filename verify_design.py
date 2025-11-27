from playwright.sync_api import sync_playwright

def verify_design(page):
    REGISTER_URL = 'http://localhost:3000/register.html'
    LOGIN_URL = 'http://localhost:3000/login.html'
    APP_URL = 'http://localhost:3000/index.html'

    test_user = {
        'username': f'testuser_{page.evaluate("Date.now()")}',
        'email': f'test_{page.evaluate("Date.now()")}@example.com',
        'password': 'password123'
    }

    # Register
    page.goto(REGISTER_URL)
    page.fill('#username', test_user['username'])
    page.fill('#email', test_user['email'])
    page.fill('#password', test_user['password'])
    page.click('.auth-btn')
    page.wait_for_url(LOGIN_URL)

    # Login
    page.fill('#email', test_user['email'])
    page.fill('#password', test_user['password'])
    page.click('.auth-btn')
    page.wait_for_url(APP_URL)

    # Take screenshot
    page.screenshot(path='verification_screenshot.png')

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    verify_design(page)
    browser.close()
