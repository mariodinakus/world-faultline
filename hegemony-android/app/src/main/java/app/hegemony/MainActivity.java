package app.hegemony;
import android.app.*;import android.os.*;import android.webkit.*;import android.content.pm.PackageManager;
import androidx.work.*;import java.util.concurrent.TimeUnit;
public class MainActivity extends Activity{
 WebView w;
 @Override protected void onCreate(Bundle b){super.onCreate(b);
  w=new WebView(this);WebSettings s=w.getSettings();s.setJavaScriptEnabled(true);s.setDomStorageEnabled(true);
  w.setWebViewClient(new WebViewClient());String u=getIntent().getStringExtra("url");w.loadUrl(u!=null?u:Watch.SITE);setContentView(w);
  if(Build.VERSION.SDK_INT>=33&&checkSelfPermission("android.permission.POST_NOTIFICATIONS")!=PackageManager.PERMISSION_GRANTED)requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"},1);
  Watch.channel(this);
  PeriodicWorkRequest r=new PeriodicWorkRequest.Builder(Watch.class,15,TimeUnit.MINUTES).setConstraints(new Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build()).build();
  WorkManager.getInstance(this).enqueueUniquePeriodicWork("hegemony",ExistingPeriodicWorkPolicy.KEEP,r);
  WorkManager.getInstance(this).enqueue(new OneTimeWorkRequest.Builder(Watch.class).build());}
 @Override public void onBackPressed(){if(w.canGoBack())w.goBack();else super.onBackPressed();}
}
