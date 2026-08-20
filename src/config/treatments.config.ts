import type { Treatment } from '@/models';
/** Paid upgrades default OFF (enforced in store, not here). */
export const TREATMENTS: Treatment[] = [
  { id:'ar',  price:0,  group:'included',   enabled:true,
    name:{'en-US':'Anti-reflective','zh-CN':'防反光','es-US':'Antirreflejante'},
    description:{'en-US':'Cuts glare from screens and headlights','zh-CN':'减少屏幕与车灯眩光','es-US':'Reduce el reflejo de pantallas y faros'} },
  { id:'sc',  price:0,  group:'included',   enabled:true,
    name:{'en-US':'Scratch-resistant','zh-CN':'防刮','es-US':'Resistente a rayones'},
    description:{'en-US':'Hard coating on both sides','zh-CN':'双面加硬镀膜','es-US':'Capa endurecida por ambos lados'} },
  { id:'uv',  price:0,  group:'included',   enabled:true,
    name:{'en-US':'UV protection','zh-CN':'防紫外线','es-US':'Protección UV'},
    description:{'en-US':'Blocks 100% UVA/UVB','zh-CN':'阻隔 100% UVA/UVB','es-US':'Bloquea 100% UVA/UVB'} },
  { id:'blue',price:25, group:'recommended',enabled:true,
    name:{'en-US':'Blue-light filter','zh-CN':'防蓝光','es-US':'Filtro de luz azul'},
    description:{'en-US':'Eases eye strain from screens','zh-CN':'缓解屏幕疲劳','es-US':'Alivia la fatiga visual por pantallas'} },
  { id:'photo',price:89,group:'optional',   enabled:true,
    name:{'en-US':'Light-adaptive','zh-CN':'感光变色','es-US':'Fotocromático'},
    description:{'en-US':'Darkens outdoors, clears indoors','zh-CN':'户外变深,室内透明','es-US':'Se oscurece afuera, se aclara adentro'} },
  { id:'polar',price:59,group:'optional',   enabled:true,
    name:{'en-US':'Polarized','zh-CN':'偏光','es-US':'Polarizado'},
    description:{'en-US':'Cuts reflected glare off water and roads','zh-CN':'消除水面与路面反光','es-US':'Elimina el reflejo del agua y la carretera'} },
];
export const TYPE_PRICES: Record<string, number> = { single: 0, progressive: 120, readers: 0 };
