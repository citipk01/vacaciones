
$(document).ready(function(){

	$("div.bxBtns").load('/buxis/Partials/BxBtns.html',{ limit: 25 });

});


function OnSelVac(){

	bxF('dias_totales').Enable(false);
	bxF('dias_restantes').Enable(false);
	bxF('dias_tomados').Enable(false);
	$('#bxBtnAddSubKey').css('display','none');
	$('#bxBtnDeleteSubKey').css('display','none');

	var diasArr = 0;
	if (bxF('dias_arrastre').Value() != null && bxF('dias_arrastre').Value() != ""){
		diasArr = parseInt(bxF('dias_arrastre').Value());
	}

	var diasCal = 0
	if (bxF('dias_calculados').Value() != null && bxF('dias_calculados').Value() != ""){
		diasCal = parseInt(bxF('dias_calculados').Value());
	}

	bxF('dias_totales').Value(diasArr + diasCal);

	RecalcularTotales();

	if (bxG('grillaEmp').Rows.length == 1 && (bxG('grillaEmp',0,'fec_pedido').Value() == null || bxG('grillaEmp',0,'fec_pedido').Value() == '')){
		bxG('grillaEmp',0,'fec_pedido').Value(FormatDateToStr(new Date()), true);
	}

	BXData('CITI.GET.REGION', [new BXParameter('COD_EMP',bxF('cod_emp').Value())], function(){
			if(this.Results.length < 1){
				Error('No existe la empresa ' + bxF('cod_emp').Value());
			}
			var region = this.Results[0].REGION;
			if (region == 'URY'){
				bxF('periodo').Enable(true);
				bxF('cod_emp').Enable(true);
				bxF('dias_arrastre').Enable(true);
				bxF('dias_calculados').Enable(true);
				bxF('max_frag').Enable(true);
				$('#bxBtnAddSubKey').css('display','block');
				$('#bxBtnDeleteSubKey').css('display','block');
			}else{
				bxF('periodo').Enable(false);
				bxF('cod_emp').Enable(false);
				bxF('dias_arrastre').Enable(false);
				bxF('dias_calculados').Enable(false);
				bxF('max_frag').Enable(false);
			}
		});

	bxF().HasChanged = false;

}

function OnSaveVac(){
}

function CambioFecIni(campo){

	var fila = campo.GridRow;

	if(fila.ControlByName('fec_fin').Value() != '' && campo.Value() != ''){
		if(GetDateFromStr(campo.Value()) > GetDateFromStr(fila.ControlByName('fec_fin').Value())){
			fila.ControlByName('dias').Value(0);
		}else{
			fila.ControlByName('dias').Value(DiffDatesStr(campo.Value(), fila.ControlByName('fec_fin').Value()));
		}
	}
	if(campo.Value() != ''){
		if (GetDateFromStr(campo.Value()).getDay() != 1){
			Msg('El día de la fecha de inicio no es Lunes.');
		}
		fila.ControlByName('plus_vac').Value('Y');
		if (fila.ControlByName('anio').Value() == ''){
			fila.ControlByName('anio').Value(GetDateFromStr(campo.Value()).getFullYear());
		}
	}else{
		fila.ControlByName('plus_vac').Value('N');
	}

}

function CambioDias(campo){
	if(parseInt(campo.Value()) < 0){
		campo.Value(campo.OldValue);
		Error('Los días no pueden ser negativos');
	}
	var fila = campo.GridRow;
	if(fila.ControlByName('fec_ini').Value() != '' && campo.Value() != ''){
		fila.ControlByName('fec_fin').Value(AddDaysToDateStr(fila.ControlByName('fec_ini').Value(), parseInt(campo.Value())),true);
	}
	if(parseInt(campo.Value()) > 7){
		fila.ControlByName('ade_vac').Value('Y');
	}else{
		fila.ControlByName('ade_vac').Value('N');
	}
	RecalcularTotales();
}

function RecalcularTotales(){
	var t = 0;
	var tot = 0;
	for(t=0;t<bxG('grillaEmp').Rows.length;t++){
		if (bxG('grillaEmp',t).Status != 'E' && bxG('grillaEmp',t).Status != 'D' && bxG('grillaEmp',t).Status != 'N' ){
			if (bxG('grillaEmp',t,'dias').Value() != null && bxG('grillaEmp',t,'dias').Value() != ""){
				tot += parseInt(bxG('grillaEmp',t,'dias').Value());
			}
		}
	}
	bxF('dias_tomados').Value(tot);
	bxF('dias_restantes').Value(parseInt(bxF('dias_totales').Value()) - parseInt(bxF('dias_tomados').Value()));
}

function CambioFecFin(campo){

	var fila = campo.GridRow;

	if(fila.ControlByName('fec_ini').Value() != '' && campo.Value() != ''){
		if(GetDateFromStr(campo.Value()) < GetDateFromStr(fila.ControlByName('fec_ini').Value())){
			fila.ControlByName('dias').Value(0);
		}else{
			fila.ControlByName('dias').Value(DiffDatesStr(fila.ControlByName('fec_ini').Value(), campo.Value()));
		}
	}

}

function CambioMes(campo){
	if(parseInt(campo.Value()) < 1 || parseInt(campo.Value()) > 12){
		campo.Value(campo.OldValue);
		Error('Mes incorrecto');
	}
}

function CambioRestantes(campo){
	if(campo.Value() < 0){
		Msg('Los días restantes quedaron en negativos. Se están asignando más vacaciones de las permitidas.');
	}else{
		if (campo.Value() > 0){
			var cantLineas = 0;
			for(ifrag=0;ifrag<bxG('grillaEmp').Rows.length;ifrag++){
				if (bxG('grillaEmp',ifrag).Status != 'E' && bxG('grillaEmp',ifrag).Status != 'D' && bxG('grillaEmp',ifrag).Status != 'N' ){
					cantLineas++;
				}
			}
			if (cantLineas >= parseInt(bxF('max_frag').Value())){
				Msg('Aun quedan días por tomar y ya se alcanzó la fragmentación máxima permitida. En esta salida el empleado debería tomar todos los días restantes.');
			}
		}
	}
}

function GrillaDel(fila){

	if(fila.ControlByName('dias').Value() != ''){
		var dias_tom = parseInt(bxF('dias_tomados').Value());
		var dias_res = parseInt(bxF('dias_restantes').Value());
		var dias = parseInt(fila.ControlByName('dias').Value());

		bxF('dias_tomados').Value(dias_tom - dias);
		bxF('dias_restantes').Value(dias_res + dias);
	}

}


function GrillaAdd(fila){

	if (fila.Status == 'N'){
		fila.ControlByName('fec_pedido').Value(FormatDateToStr(new Date()),true);
	}

}


