<template>
  <view class="page-pad">
    <KyotoHeader back fallback="/pages/cart/index" />
    <text class="h1">{{$t('checkout.title')}}</text>

    <!-- ============ 地址 ============ -->
    <text class="grp">{{$t('c3.addr.title')}}</text>
    <view v-if="addrStore.list.length" class="mode-tog">
      <text :class="['mt',{on:d.mode==='saved'}]" @click="setMode('saved')">{{$t('c3.addr.useSaved')}}</text>
      <text :class="['mt',{on:d.mode==='new'}]" @click="setMode('new')">{{$t('c3.addr.enterNew')}}</text>
    </view>
    <view v-if="d.mode==='saved'&&addrStore.list.length">
      <view v-for="a in addrStore.list" :key="a.id" :class="['saved-a',{on:d.savedId===a.id}]" @click="pickSaved(a.id)">
        <view class="sa-tx">
          <text class="sa-n">{{a.firstName}} {{a.lastName}} <text v-if="a.isDefault" class="def-tag">{{$t('c3.addr.isDefault')}}</text></text>
          <text class="sa-l">{{a.line1}}<template v-if="a.line2">, {{a.line2}}</template></text>
          <text class="sa-l">{{a.city}}, {{a.stateCode}} {{a.zip}}</text>
        </view>
        <view :class="['radio',{on:d.savedId===a.id}]"></view>
      </view>
    </view>
    <view v-else class="fields">
      <view class="frow">
        <FormInput v-model="d.addr.firstName" :label="$t('c3.addr.first')" :error="errText('firstName')" @blur="touch('firstName')"/>
        <FormInput v-model="d.addr.lastName" :label="$t('c3.addr.last')" :error="errText('lastName')" @blur="touch('lastName')"/>
      </view>
      <FormInput v-model="d.addr.line1" :label="$t('c3.addr.line1')" :error="errText('line1')" @blur="touch('line1')"/>
      <FormInput v-model="d.addr.line2" :label="$t('c3.addr.line2')"/>
      <view class="frow">
        <FormInput v-model="d.addr.city" :label="$t('c3.addr.city')" :error="errText('city')" @blur="touch('city')"/>
        <view class="fcol">
          <text class="flb">{{$t('c3.addr.state')}}</text>
          <StateSelector v-model="d.addr.stateCode" :error="errText('stateCode')"/>
        </view>
      </view>
      <view class="frow">
        <FormInput v-model="d.addr.zip" :label="$t('c3.addr.zip')" type="number" :error="errText('zip')" @blur="touch('zip')"/>
        <FormInput v-model="d.addr.phone" :label="$t('c3.addr.phone')" type="tel" :error="errText('phone')" @blur="touch('phone')"/>
      </view>
      <FormInput v-model="d.addr.email" :label="$t('c3.addr.email')" type="email" :error="errText('email')" @blur="touch('email')"/>
    </view>

    <!-- ============ 配送方式 ============ -->
    <text class="grp">{{$t('c3.ship.title')}}</text>
    <view v-for="m in shipMethods" :key="m.id" :class="['ship-m',{on:d.shippingMethodId===m.id}]" @click="pickShip(m.id)">
      <view class="sm-tx">
        <text class="sm-n">{{m.name[loc]}}</text>
        <text class="sm-eta">{{$t('c3.ship.eta',{a:m.etaDays[0],b:m.etaDays[1]})}}</text>
        <text v-if="m.freeOver!=null" class="sm-free">{{$t('c3.ship.freeOver',{n:m.freeOver})}}</text>
      </view>
      <text class="sm-pr">{{shipPrice(m.id)===0?$t('cart.freeShipping'):'$'+shipPrice(m.id)}}</text>
    </view>

    <!-- ============ 支付方式 ============ -->
    <text class="grp">{{$t('checkout.payment')}}</text>
    <view class="pay-methods">
      <view v-for="m in methods" :key="m.k" :class="['pm',{on:d.payMethod===m.k}]" @click="setPay(m.k)">
        <text class="pmic">{{m.ic}}</text>
        <text class="pmn">{{$t('checkout.'+m.k)}}</text>
        <text v-if="m.k==='fsa'&&fsaEligible" class="fsa-tag">{{$t('c3.fsa.eligible')}}</text>
      </view>
    </view>
    <view v-if="d.payMethod==='card'" class="card-form">
      <FormInput v-model="card.name" :label="$t('c3.pay.cardName')"/>
      <FormInput v-model="card.number" :label="$t('c3.pay.cardNumber')" type="number" placeholder="•••• •••• •••• ••••"/>
      <view class="frow">
        <FormInput v-model="card.expiry" :label="$t('c3.pay.expiry')" type="number" placeholder="MM/YY"/>
        <FormInput v-model="card.cvc" :label="$t('c3.pay.cvc')" type="number" placeholder="•••"/>
      </view>
      <label class="bill-row" @click="card.billingSame=!card.billingSame">
        <view :class="['chk',{on:card.billingSame}]">✓</view>
        <text class="bill-tx">{{$t('c3.pay.billingSame')}}</text>
      </label>
      <text class="mock-note">{{$t('c3.pay.mockCard')}}</text>
    </view>

    <!-- ============ 订单摘要 ============ -->
    <text class="grp">{{$t('c3.sum.title')}}</text>
    <PriceSummary :rows="sumRows" @edit="editRow"/>

    <view class="sticky-cta">
      <text v-if="checkout.placeState==='failure'" class="fail-tx">⚠ {{$t('c3.place.failed')}}</text>
      <KyotoButton variant="pink" :loading="busy" :disabled="busy" @click="place">
        {{ ctaLabel }}
      </KyotoButton>
    </view>
  </view>
</template>
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import KyotoHeader from '@/components/KyotoHeader.vue';
import KyotoButton from '@/components/KyotoButton.vue';
import PriceSummary, { type PriceRow } from '@/components/PriceSummary.vue';
import StateSelector from '@/components/StateSelector.vue';
import FormInput from '@/components/FormInput.vue';
import { useCartStore } from '@/stores/cart';
import { useOrderStore } from '@/stores/order';
import { useAddressStore } from '@/stores/address';
import { useCheckoutStore } from '@/stores/checkout';
import { useProductStore } from '@/stores/product';
import { TaxService } from '@/services/TaxService';
import { OrderService } from '@/services/OrderService';
import { PaymentService } from '@/services/PaymentService';
import { ShippingService } from '@/services/ShippingService';
import { AddressValidationService } from '@/services/AddressValidationService';
import { LENS_MATERIALS } from '@/config/lens-materials.config';
import { TREATMENTS } from '@/config/treatments.config';
import { money } from '@/utils/format';
import type { Locale, Address } from '@/models';
import { onShow } from '@dcloudio/uni-app';

const { locale, t } = useI18n();
const loc = computed(()=>locale.value as Locale);
const cart = useCartStore(); const orderStore = useOrderStore();
const addrStore = useAddressStore(); const checkout = useCheckoutStore();
const products = useProductStore();
const d = computed(()=>checkout.d);
const tax = ref(0);
const touched = ref<Record<string,boolean>>({});
/** Card fields are intentionally NOT persisted anywhere. */
const card = ref({ name:'', number:'', expiry:'', cvc:'', billingSame:true });
const shipMethods = ShippingService.methods();
import { applePayUiAllowed } from '@/utils/platform';
const methods = [{k:'applePay',ic:''},{k:'card',ic:'💳'},{k:'fsa',ic:'🏥'}].filter(m=>m.k!=='applePay'||applePayUiAllowed());
const busy = computed(()=>checkout.placeState==='validating'||checkout.placeState==='processing');

onShow(()=>{ products.ensure();
  if (!methods.some(m=>m.k===d.value.payMethod)) { d.value.payMethod='card'; checkout.persist(); }
  if (!cart.items.length) { uni.reLaunch({ url:'/pages/cart/index' }); return; }   // direct-entry guard
  if (d.value.mode==='saved' && !d.value.savedId && addrStore.def) { d.value.savedId = addrStore.def.id; checkout.persist(); }
  if (!addrStore.list.length) { d.value.mode='new'; }
  refreshTax();
});
const activeAddr = computed<Address>(()=> d.value.mode==='saved'
  ? (addrStore.list.find(a=>a.id===d.value.savedId) ?? addrStore.def ?? d.value.addr)
  : d.value.addr);
const errors = computed(()=>AddressValidationService.validate(activeAddr.value));
const errText = (f:string)=> (touched.value[f]||touched.value.__all) && (errors.value as any)[f]
  ? t('c3.val.'+((errors.value as any)[f])) : '';
const touch = (f:string)=>{ touched.value[f]=true; checkout.persist(); };
const fsaEligible = computed(()=>cart.items.length>0 && cart.items.every(i=>products.byId(i.frameId)?.fsaEligible));
const shipPrice = (id:string)=>ShippingService.price(id, cart.subtotal);
const shipCost = computed(()=>shipPrice(d.value.shippingMethodId));
async function refreshTax(){ tax.value = await TaxService.estimate(cart.subtotal + shipCost.value, { stateCode: activeAddr.value.stateCode } as any); }
watch(()=>activeAddr.value.stateCode, refreshTax);
watch(()=>d.value.shippingMethodId, refreshTax);
watch(()=>cart.subtotal, refreshTax);

const setMode = (m:'saved'|'new')=>{ d.value.mode=m; checkout.persist(); };
const pickSaved = (id:string)=>{ d.value.savedId=id; checkout.persist(); };
const pickShip = (id:string)=>{ d.value.shippingMethodId=id; checkout.persist(); };
const setPay = (k:string)=>{ d.value.payMethod=k; checkout.persist(); };

const sumRows = computed<PriceRow[]>(()=>{
  const rows: PriceRow[] = [];
  for (const it of cart.items) {
    const f = products.byId(it.frameId);
    rows.push({ key:'frame', label:t('c3.sum.frame'), value:`${f?.name[loc.value]??it.frameId} · ${it.colorKey} · ${it.sizeKey}`, sub:money(it.framePrice), editable:true });
    if (it.config) {
      if (it.config.type) rows.push({ label:t('c3.sum.lensType'), value:t('wizard.s2.'+it.config.type), sub:it.typePrice?'+'+money(it.typePrice):t('common.included') });
      const m = LENS_MATERIALS.find(x=>x.id===it.config!.materialId);
      if (m) rows.push({ label:t('c3.sum.lensMaterial'), value:m.name[loc.value], sub:it.lensMaterialPrice?'+'+money(it.lensMaterialPrice):t('common.included') });
      const trs = TREATMENTS.filter(x=>it.config!.treatmentIds.includes(x.id));
      if (trs.length) rows.push({ label:t('c3.sum.treatments'), value:trs.map(x=>x.name[loc.value]).join(', '), sub:'+'+money(Object.values(it.treatmentPrices).reduce((a,b)=>a+b,0)) });
      const rxKey = it.config.prescriptionMethod==='later'?'needed':it.config.prescriptionMethod==='saved'?'verified':'received';
      rows.push({ label:t('c3.sum.rxStatus'), value:t('c3.rxs.'+rxKey) });
    }
  }
  rows.push({ label:t('cart.subtotal'), value:money(cart.subtotal) });
  rows.push({ label:t('c3.sum.shipping'), value: shipCost.value===0?t('cart.freeShipping'):money(shipCost.value) });
  rows.push({ label:t('c3.sum.tax'), value:money(tax.value) });
  rows.push({ label:t('c3.sum.total'), value:money(cart.subtotal+shipCost.value+tax.value), total:true });
  return rows;
});
const editRow = (k?:string)=>{ if(k==='frame') uni.navigateTo({url:'/pages/cart/index'}); };

const ctaLabel = computed(()=>{
  if (checkout.placeState==='validating') return t('c3.place.validating');
  if (checkout.placeState==='processing') return t('c3.place.processing');
  if (checkout.placeState==='failure') return t('c3.place.retry');
  return t('checkout.placeOrder');
});

async function place(){
  if (busy.value) return;                       // double-submit guard
  checkout.placeState='validating';
  touched.value={ __all:true };
  await new Promise(r=>setTimeout(r,350));
  if (!AddressValidationService.isValid(activeAddr.value) || !cart.items.length) {
    checkout.placeState='idle';
    uni.showToast({ title:t('prescription.manual.invalid'), icon:'none' });
    return;
  }
  checkout.placeState='processing';
  try {
    await PaymentService.pay(d.value.payMethod as any, cart.subtotal+shipCost.value+tax.value);
    const order = await OrderService.place([...cart.items],
      { subtotal:cart.subtotal, shipping:shipCost.value, tax:tax.value },
      d.value.payMethod, JSON.parse(JSON.stringify(activeAddr.value)), cart.rxNeeded, d.value.shippingMethodId);
    orderStore.lastOrderId = order.orderId;
    cart.clear(); checkout.placeState='success'; checkout.reset();
    uni.reLaunch({ url:`/pages/order/confirmation?id=${order.orderId}` });
  } catch {
    checkout.placeState='failure';
  }
}
</script>
<style lang="scss" scoped>
.mode-tog{display:flex;background:$mist;border-radius:$r-sm;padding:6rpx;margin-bottom:18rpx}
.mt{flex:1;text-align:center;padding:16rpx;border-radius:16rpx;font-size:$fs-xs;color:$muted;line-height:1.3}
.mt.on{background:#fff;color:$night;font-weight:$fw-semi;box-shadow:0 2rpx 8rpx rgba(0,0,0,.06)}
.saved-a{display:flex;align-items:center;gap:18rpx;background:#fff;border:3rpx solid $line;border-radius:$r-md;padding:24rpx;margin-bottom:14rpx}
.saved-a.on{border-color:$sakura;background:#FFF0F5}
.sa-tx{flex:1;min-width:0}
.sa-n{display:block;font-size:$fs-sm;font-weight:$fw-semi;margin-bottom:4rpx}
.def-tag{background:$tint-teal2;color:$teal;font-size:18rpx;padding:2rpx 12rpx;border-radius:$r-pill;font-weight:$fw-semi;margin-left:8rpx}
.sa-l{display:block;font-size:$fs-xs;color:$muted;line-height:1.5}
.radio{width:36rpx;height:36rpx;border-radius:50%;border:4rpx solid $line;flex-shrink:0}
.radio.on{border-color:$sakura;background:radial-gradient($sakura 45%,transparent 48%)}
.fields{display:flex;flex-direction:column;gap:16rpx;margin-bottom:6rpx}
.frow{display:grid;grid-template-columns:1fr 1fr;gap:14rpx}
.fcol{display:flex;flex-direction:column;gap:10rpx}
.flb{font-size:$fs-xs;color:$muted;font-weight:$fw-med}
.ship-m{display:flex;align-items:center;gap:18rpx;background:#fff;border:3rpx solid $line;border-radius:$r-md;padding:24rpx;margin-bottom:14rpx}
.ship-m.on{border-color:$sakura;background:#FFF0F5}
.sm-tx{flex:1;min-width:0}
.sm-n{display:block;font-size:$fs-sm;font-weight:$fw-semi}
.sm-eta{display:block;font-size:$fs-xs;color:$muted;margin-top:2rpx}
.sm-free{display:block;font-size:$fs-xs;color:$teal;margin-top:2rpx}
.sm-pr{font-size:$fs-sm;font-weight:$fw-bold;color:$sunrise;white-space:nowrap}
.pay-methods{display:flex;flex-direction:column;gap:14rpx;margin-bottom:10rpx}
.pm{display:flex;align-items:center;gap:18rpx;padding:24rpx;border:3rpx solid $line;border-radius:$r-md;background:#fff}
.pm.on{border-color:$sakura;background:#FFF0F5}
.pmic{font-size:36rpx;width:52rpx;text-align:center}
.pmn{flex:1;font-size:$fs-sm;font-weight:$fw-semi}
.fsa-tag{background:$tint-teal2;color:$teal;font-size:18rpx;padding:4rpx 14rpx;border-radius:$r-pill;font-weight:$fw-semi}
.card-form{background:#fff;border:2rpx solid $line;border-radius:$r-md;padding:22rpx;display:flex;flex-direction:column;gap:16rpx;margin-bottom:10rpx}
.bill-row{display:flex;align-items:center;gap:14rpx}
.chk{width:40rpx;height:40rpx;border-radius:12rpx;border:3rpx solid $line;display:flex;align-items:center;justify-content:center;color:transparent;font-size:22rpx;flex-shrink:0}
.chk.on{background:$teal;border-color:$teal;color:#fff}
.bill-tx{font-size:$fs-xs;color:$muted;line-height:1.4;flex:1}
.mock-note{font-size:$fs-xs;color:$muted;opacity:.65}
.fail-tx{display:block;text-align:center;font-size:$fs-xs;color:$sunrise;margin-bottom:12rpx;font-weight:$fw-med}
</style>
