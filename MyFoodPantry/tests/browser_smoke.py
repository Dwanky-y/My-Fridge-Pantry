from playwright.sync_api import sync_playwright
import json, tempfile, os
summary=[{'id':123,'title':'Quick egg pasta','usedIngredientCount':2,'missedIngredientCount':0,'usedIngredients':[{'name':'egg'},{'name':'pasta'}],'missedIngredients':[]}]
detail={'id':123,'title':'Quick egg pasta','servings':2,'readyInMinutes':20,'sourceName':'Test Kitchen','sourceUrl':'https://example.com/pasta','extendedIngredients':[{'id':1123,'name':'eggs','amount':2,'unit':'','original':'2 eggs'},{'id':20420,'name':'pasta','amount':200,'unit':'g','original':'200 g pasta'}],'analyzedInstructions':[{'steps':[{'step':'Boil pasta according to the packet.'},{'step':'Cook eggs and combine.'}]}]}
with sync_playwright() as p:
    profile=tempfile.mkdtemp(prefix='pantry-v2-',dir='/tmp')
    context=p.chromium.launch_persistent_context(profile,executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'),headless=True,args=['--no-sandbox'],viewport={'width':1440,'height':1100})
    page=context.pages[0]; errors=[]
    page.on('pageerror',lambda error: errors.append(str(error)))
    page.goto(os.environ.get('APP_URL', 'http://127.0.0.1:5173/'),wait_until='networkidle')
    assert page.get_by_role('region',name='Fridge / Freezer').is_visible()
    assert page.get_by_role('region',name='Pantry',exact=True).is_visible()
    assert page.evaluate("localStorage.getItem('little-pantry.kitchen.v2')") is None
    page.get_by_role('button',name='Save on this device',exact=True).click()
    def add(name,amount,unit,location):
        page.get_by_label('What do you have?').fill(name)
        page.get_by_label('Quantity',exact=True).fill(str(amount))
        page.get_by_label('Unit',exact=True).select_option(unit)
        page.get_by_label('Store in',exact=True).select_option(location)
        page.get_by_role('button',name='Add ingredient',exact=True).click()
    add('eggs',6,'piece','Fridge'); add('pasta',1,'kg','Pantry')
    def mock(route):
        payload=detail if route.request.url.split('?')[0].endswith('/123') else summary
        route.fulfill(status=200,content_type='application/json',body=json.dumps(payload))
    page.route('**/api/recipes**',mock)
    page.get_by_role('button',name='Find recipes',exact=True).click()
    page.get_by_role('button',name='Quick egg pasta',exact=False).click()
    page.get_by_label('Servings',exact=True).fill('4')
    assert page.get_by_label('Use quantity of eggs',exact=True).input_value() == '4'
    assert page.get_by_label('Use quantity of pasta',exact=True).input_value() == '0.4'
    page.get_by_role('button',name='Start cooking & deduct',exact=True).click()
    assert page.get_by_text('Ingredient use recorded. You can undo it from My kitchen.').is_visible()
    assert page.get_by_label('Servings',exact=True).is_disabled()
    assert page.get_by_role('button',name='Start cooking & deduct',exact=True).count() == 0
    page.get_by_role('button',name='Close recipe',exact=True).click()
    assert page.get_by_label('Quantity of eggs in Fridge / Freezer',exact=True).input_value() == '2'
    assert page.get_by_label('Quantity of pasta in Pantry',exact=True).input_value() == '0.6'
    context.close()
    context=p.chromium.launch_persistent_context(profile,executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'),headless=True,args=['--no-sandbox'],viewport={'width':390,'height':844})
    page=context.pages[0]; page.route('**/api/recipes**',mock)
    page.goto(os.environ.get('APP_URL', 'http://127.0.0.1:5173/'),wait_until='networkidle')
    assert page.get_by_label('Quantity of eggs in Fridge / Freezer',exact=True).input_value() == '2'
    page.get_by_role('button',name='Undo ingredient use',exact=True).click()
    assert page.get_by_label('Quantity of eggs in Fridge / Freezer',exact=True).input_value() == '6'
    assert page.get_by_label('Quantity of pasta in Pantry',exact=True).input_value() == '1'
    page.get_by_role('button',name='Find recipes',exact=True).click()
    page.get_by_role('button',name='Quick egg pasta',exact=False).click()
    page.get_by_label('Use quantity of pasta',exact=True).fill('2')
    assert page.get_by_role('button',name='Start cooking & deduct',exact=True).is_disabled()
    assert page.get_by_text('Not enough pasta: you have 1 kg.').is_visible()
    page.get_by_label('Use quantity of pasta',exact=True).fill('0.2')
    page.get_by_role('button',name='I’ve made this · deduct',exact=True).click()
    page.get_by_role('button',name='Close recipe',exact=True).click()
    assert page.get_by_label('Quantity of eggs in Fridge / Freezer',exact=True).input_value() == '4'
    assert page.get_by_label('Quantity of pasta in Pantry',exact=True).input_value() == '0.8'
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Mobile overflow'
    page.screenshot(path='/tmp/pantry-v2-mobile.png',full_page=True)
    page.get_by_role('button',name='Privacy settings',exact=True).click()
    page.get_by_role('button',name='Use for this session only',exact=True).click()
    assert page.evaluate("localStorage.getItem('little-pantry.kitchen.v2')") is None
    assert page.get_by_label('Quantity of eggs in Fridge / Freezer',exact=True).input_value() == '4'
    page.get_by_role('button',name='Delete my saved data',exact=True).click()
    page.get_by_role('button',name='Confirm deletion',exact=True).click()
    page.get_by_role('button',name='Close privacy settings',exact=True).click()
    assert page.locator('.quantity-item').count() == 0
    page.reload(wait_until='networkidle')
    assert page.locator('.quantity-item').count() == 0
    assert not errors,errors
    context.close()
    print('PASS (mocked Spoonacular responses): both shelves visible, consent before storage, add quantities, servings scaling, mass conversion, atomic deduction, duplicate action prevention, full-browser persistence, undo, insufficient stock, made-recipe deduction, privacy withdrawal, deletion, mobile layout')
