#!/usr/bin/env python3
"""Offline regression test for the source-data XLSX parser."""
import datetime as dt
import importlib.util
import io
import json
import zipfile
from xml.sax.saxutils import escape

spec=importlib.util.spec_from_file_location("sync","pax/scripts/sync_economy_prices.py")
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
keys=["OIL_BRENT","NGAS_EUR","WHEAT_US_HRW","UREA","GOLD","COPPER","RICE_5"]
def inline(ref,s):
 return '<c r="%s" t="inlineStr"><is><t>%s</t></is></c>'%(ref,escape(str(s)))
def num(ref,v):
 return '<c r="%s"><v>%s</v></c>'%(ref,v)
def row(i,inner):
 return '<row r="%s">%s</row>'%(i,inner)
header=row(4,inline("A4","Date")+"".join(inline(chr(66+j)+"4",v) for j,v in enumerate(keys)))
units=row(5,inline("A5","") + "".join(inline(chr(66+j)+"5","US$/mt") for j in range(len(keys))))
records=[]
for n in range(140):
 year,month=divmod(n,12);year+=2000;month+=1
 rnum=n+6
 cells=inline("A"+str(rnum),f"{year}M{month:02}")
 cells+="".join(num(chr(66+j)+str(rnum),10+n*.2+j) for j in range(len(keys)))
 records.append(row(rnum,cells))
sheet='<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>'+header+units+"".join(records)+'</sheetData></worksheet>'
workbook='<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Monthly Prices" sheetId="1" r:id="rId1"/></sheets></workbook>'
rels='<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Target="worksheets/sheet1.xml" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet"/></Relationships>'
bio=io.BytesIO()
with zipfile.ZipFile(bio,"w") as z:
 z.writestr("xl/workbook.xml",workbook)
 z.writestr("xl/_rels/workbook.xml.rels",rels)
 z.writestr("xl/worksheets/sheet1.xml",sheet)
out=module.build(bio.getvalue(),"https://example.invalid/test.xlsx")
assert len(out["series"])==7
assert len(out["series"]["brent"]["points"])==140
assert out["lastPeriod"]=="2011-08"
assert out["series"]["gas_eu"]["points"][0][1]==11
print("Pink Sheet XLSX synthetic fixture OK")
