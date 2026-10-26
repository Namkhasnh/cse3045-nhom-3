// Connected browser helper: use the profile API and the cart's real continuation.
// No checkout form fields, invented fee or fake order success.
export async function prepareCheckoutReview({evaluate,navigate,until,pointName,buyerLogin,recipientName='Người nhận giả lập P16'}) {
 await evaluate(`(async()=>{const me=await(await fetch('/api/v1/auth/me')).json(),u=me.data;const name=u.login_identifier===${JSON.stringify(buyerLogin)}?${JSON.stringify(recipientName)}:u.display_name;if(!u.phone||u.display_name!==name){const csrf=document.cookie.split('; ').find(x=>x.startsWith('__Host-hlf_csrf=')).split('=')[1];const r=await fetch('/api/v1/profile',{method:'PATCH',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf},body:JSON.stringify({expected_version:u.version,display_name:name,phone:u.phone||'0900000000'})});if(!r.ok)throw new Error('Synthetic profile update failed')}})()`)
 await navigate('/cart')
 await evaluate("document.querySelectorAll('.cart-shop input[type=checkbox]').forEach(el=>{if(!el.checked)el.click()})")
 await until(()=>evaluate(`(()=>{const s=document.querySelector('#cart-point');return s&&!s.disabled&&Array.from(s.options).some(o=>o.textContent===${JSON.stringify(pointName)})})()`),'Cart point unavailable')
 await evaluate(`(()=>{const s=document.querySelector('#cart-point');s.value=Array.from(s.options).find(o=>o.textContent===${JSON.stringify(pointName)}).value;s.dispatchEvent(new Event('change',{bubbles:true}))})()`)
 if(await evaluate("Boolean(document.querySelector('.cart-consent button'))"))await evaluate("document.querySelector('.cart-consent button').click()")
 await until(()=>evaluate("Boolean(document.querySelector('.cart-summary-action button:not(:disabled)'))"),'Cart review not ready')
 await evaluate("document.querySelector('.cart-summary-action button').click()")
 await until(()=>evaluate("location.pathname==='/checkout'&&Boolean(document.querySelector('.checkout-summary button[type=submit]:not(:disabled)'))"),'Checkout preview not ready')
}
