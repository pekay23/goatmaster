import { recordDetail } from '../../_detail';
type Context={params:Promise<{id:string}>};
export async function GET(request:Request,{params}:Context){return recordDetail(request,(await params).id,'weight_records');}
export async function PATCH(request:Request,{params}:Context){return recordDetail(request,(await params).id,'weight_records');}
export async function DELETE(request:Request,{params}:Context){return recordDetail(request,(await params).id,'weight_records');}
