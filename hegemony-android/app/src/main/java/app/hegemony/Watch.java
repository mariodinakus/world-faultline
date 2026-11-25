package app.hegemony;
import android.app.*;import android.content.*;import androidx.annotation.NonNull;import androidx.work.*;
import org.json.*;import java.io.*;import java.net.*;
public class Watch extends Worker{
 static final String SITE="https://hegemony-world-power.vercel.app/";
 public Watch(@NonNull Context c,@NonNull WorkerParameters p){super(c,p);}
 static void channel(Context c){NotificationManager m=c.getSystemService(NotificationManager.class);m.createNotificationChannel(new NotificationChannel("alerts","Ειδοποιήσεις HEGEMONY",NotificationManager.IMPORTANCE_HIGH));}
 static String get(String u)throws Exception{HttpURLConnection h=(HttpURLConnection)new URL(u).openConnection();h.setConnectTimeout(20000);h.setReadTimeout(40000);
  try(BufferedReader r=new BufferedReader(new InputStreamReader(h.getInputStream(),"UTF-8"))){StringBuilder s=new StringBuilder();String l;while((l=r.readLine())!=null)s.append(l);return s.toString();}}
 void notify(int id,String t,String body,String anchor){Context c=getApplicationContext();channel(c);
  Intent i=new Intent(c,MainActivity.class).putExtra("url",SITE+anchor).setFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_CLEAR_TOP);
  PendingIntent pi=PendingIntent.getActivity(c,id,i,PendingIntent.FLAG_IMMUTABLE|PendingIntent.FLAG_UPDATE_CURRENT);
  Notification n=new Notification.Builder(c,"alerts").setSmallIcon(android.R.drawable.ic_dialog_alert).setContentTitle(t).setContentText(body).setStyle(new Notification.BigTextStyle().bigText(body)).setContentIntent(pi).setAutoCancel(true).build();
  try{c.getSystemService(NotificationManager.class).notify(id,n);}catch(SecurityException e){}}
 @NonNull @Override public Result doWork(){SharedPreferences p=getApplicationContext().getSharedPreferences("h",0);SharedPreferences.Editor e=p.edit();boolean first=!p.contains("init");
  try{JSONArray a=new JSONObject(get(SITE+"api/tension")).getJSONArray("pairs");
   for(int i=0;i<a.length();i++){JSONObject o=a.getJSONObject(i);if(o.isNull("score"))continue;int s=o.getInt("score");String k="t_"+o.getString("a")+o.getString("b");int old=p.getInt(k,-1);e.putInt(k,s);
    if(!first&&old>=0&&((s>=80&&old<80)||s-old>=15)){String head="";JSONArray top=o.optJSONArray("top");if(top!=null&&top.length()>0)head=top.getJSONObject(0).optString("title");
     notify(100+i,"🔥 Ένταση "+o.getString("a")+"–"+o.getString("b")+": "+old+" → "+s,head,"#camps");}}}catch(Exception x){}
  try{JSONArray ev=new JSONObject(get(SITE+"api/odds")).getJSONArray("events");
   for(int i=0;i<ev.length();i++){JSONObject o=ev.getJSONObject(i);JSONArray ms=o.getJSONArray("markets");
    for(int j=0;j<ms.length();j++){JSONObject m=ms.getJSONObject(j);int v=(int)Math.round(m.getDouble("p")*100);String k="o_"+(o.getString("title")+m.getString("q")).hashCode();int old=p.getInt(k,-1);e.putInt(k,v);
     if(!first&&old>=0&&Math.abs(v-old)>=10)notify(1000+Math.abs(k.hashCode()%5000),"🎲 "+old+"% → "+v+"%",o.getString("title")+" · "+m.getString("q"),"#future");}}}catch(Exception x){}
  try{JSONArray ps=new JSONObject(get(SITE+"api/activity")).getJSONArray("powers");
   for(int i=0;i<ps.length();i++){JSONObject o=ps.getJSONObject(i);int conf=o.optInt("conf");String k="a_"+o.getString("power");int old=p.getInt(k,-1);e.putInt(k,conf);
    if(!first&&old>=0&&conf-old>=8)notify(200+i,"⚔️ "+o.getString("power")+": απότομη άνοδος αντιπαράθεσης",old+" → "+conf+" συγκρουσιακές ειδήσεις σε 48h","#live");}}catch(Exception x){}
  e.putBoolean("init",true).apply();return Result.success();}
}
