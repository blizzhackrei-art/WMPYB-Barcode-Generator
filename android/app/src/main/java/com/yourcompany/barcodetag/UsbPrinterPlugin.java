package com.yourcompany.barcodetag;

import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.hardware.usb.UsbConstants;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbDeviceConnection;
import android.hardware.usb.UsbEndpoint;
import android.hardware.usb.UsbInterface;
import android.hardware.usb.UsbManager;
import android.os.Build;
import android.util.Base64;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.Socket;

/**
 * Raw USB + LAN (TCP 9100) printing for ESC/POS and TSPL bytes.
 * JS side: src/printer/androidUsb.js
 */
@CapacitorPlugin(name = "UsbPrinter")
public class UsbPrinterPlugin extends Plugin {

    private static final String ACTION_USB_PERMISSION = "com.yourcompany.barcodetag.USB_PERMISSION";
    private PluginCall pendingPermissionCall;
    private BroadcastReceiver receiver;

    private UsbManager manager() {
        return (UsbManager) getContext().getSystemService(Context.USB_SERVICE);
    }

    private UsbDevice find(String deviceName) {
        if (deviceName == null) return null;
        for (UsbDevice d : manager().getDeviceList().values()) {
            if (deviceName.equals(d.getDeviceName())) return d;
        }
        return null;
    }

    private boolean hasPrinterInterface(UsbDevice d) {
        for (int i = 0; i < d.getInterfaceCount(); i++) {
            if (d.getInterface(i).getInterfaceClass() == UsbConstants.USB_CLASS_PRINTER) return true;
        }
        return false;
    }

    @PluginMethod
    public void list(PluginCall call) {
        JSArray arr = new JSArray();
        UsbManager m = manager();
        for (UsbDevice d : m.getDeviceList().values()) {
            JSObject o = new JSObject();
            o.put("deviceName", d.getDeviceName());
            o.put("vendorId", d.getVendorId());
            o.put("productId", d.getProductId());
            o.put("isPrinter", hasPrinterInterface(d));
            o.put("hasPermission", m.hasPermission(d));
            arr.put(o);
        }
        JSObject ret = new JSObject();
        ret.put("devices", arr);
        call.resolve(ret);
    }

    private void registerReceiverOnce() {
        if (receiver != null) return;
        receiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                boolean granted = intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false);
                PluginCall c = pendingPermissionCall;
                if (c != null) {
                    JSObject r = new JSObject();
                    r.put("granted", granted);
                    c.resolve(r);
                    getBridge().releaseCall(c);
                    pendingPermissionCall = null;
                }
            }
        };
        IntentFilter filter = new IntentFilter(ACTION_USB_PERMISSION);
        if (Build.VERSION.SDK_INT >= 33) {
            getContext().registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            getContext().registerReceiver(receiver, filter);
        }
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        UsbDevice d = find(call.getString("deviceName"));
        if (d == null) {
            call.reject("USB device not found");
            return;
        }
        if (manager().hasPermission(d)) {
            JSObject r = new JSObject();
            r.put("granted", true);
            call.resolve(r);
            return;
        }
        registerReceiverOnce();
        getBridge().saveCall(call);
        pendingPermissionCall = call;
        Intent intent = new Intent(ACTION_USB_PERMISSION);
        intent.setPackage(getContext().getPackageName());
        int flags = Build.VERSION.SDK_INT >= Build.VERSION_CODES.S ? PendingIntent.FLAG_MUTABLE : 0;
        PendingIntent pi = PendingIntent.getBroadcast(getContext(), 0, intent, flags);
        manager().requestPermission(d, pi);
    }

    @PluginMethod
    public void write(PluginCall call) {
        String name = call.getString("deviceName");
        String b64 = call.getString("data");
        if (name == null || b64 == null) {
            call.reject("deviceName and data required");
            return;
        }
        UsbDeviceConnection conn = null;
        UsbInterface claimed = null;
        try {
            UsbDevice d = find(name);
            if (d == null) throw new Exception("USB device not found");
            UsbManager m = manager();
            if (!m.hasPermission(d)) throw new Exception("No USB permission. Tap Connect USB first.");

            UsbInterface iface = null;
            UsbEndpoint out = null;
            // Pass 0: printer class only. Pass 1: any interface with bulk OUT.
            for (int pass = 0; pass < 2 && out == null; pass++) {
                for (int i = 0; i < d.getInterfaceCount() && out == null; i++) {
                    UsbInterface it = d.getInterface(i);
                    if (pass == 0 && it.getInterfaceClass() != UsbConstants.USB_CLASS_PRINTER) continue;
                    for (int e = 0; e < it.getEndpointCount(); e++) {
                        UsbEndpoint ep = it.getEndpoint(e);
                        if (ep.getType() == UsbConstants.USB_ENDPOINT_XFER_BULK
                                && ep.getDirection() == UsbConstants.USB_DIR_OUT) {
                            iface = it;
                            out = ep;
                            break;
                        }
                    }
                }
            }
            if (out == null) throw new Exception("No bulk OUT endpoint on device");

            conn = m.openDevice(d);
            if (conn == null) throw new Exception("Cannot open USB device");
            if (!conn.claimInterface(iface, true)) throw new Exception("Cannot claim USB interface");
            claimed = iface;

            byte[] data = Base64.decode(b64, Base64.DEFAULT);
            int off = 0;
            while (off < data.length) {
                int len = Math.min(16384, data.length - off);
                int sent = conn.bulkTransfer(out, data, off, len, 5000);
                if (sent < 0) throw new Exception("USB write failed");
                off += sent;
            }
            call.resolve();
        } catch (Exception ex) {
            call.reject(ex.getMessage() != null ? ex.getMessage() : "USB error");
        } finally {
            if (conn != null) {
                if (claimed != null) conn.releaseInterface(claimed);
                conn.close();
            }
        }
    }

    @PluginMethod
    public void tcpSend(PluginCall call) {
        String host = call.getString("host");
        Integer port = call.getInt("port", 9100);
        String b64 = call.getString("data");
        if (host == null || b64 == null) {
            call.reject("host and data required");
            return;
        }
        Socket socket = new Socket();
        try {
            socket.connect(new InetSocketAddress(host, port), 5000);
            OutputStream os = socket.getOutputStream();
            os.write(Base64.decode(b64, Base64.DEFAULT));
            os.flush();
            call.resolve();
        } catch (Exception ex) {
            call.reject("LAN print failed: " + ex.getMessage());
        } finally {
            try { socket.close(); } catch (Exception ignored) {}
        }
    }

    @Override
    protected void handleOnDestroy() {
        if (receiver != null) {
            try { getContext().unregisterReceiver(receiver); } catch (Exception ignored) {}
            receiver = null;
        }
    }
}
