# **🌐 Remote Configuration Guide**

This document explains how the host application **linid-im-front** loads external plugins using **Module Federation**.

Remote applications (modules, catalogs, features…) are dynamically loaded at runtime using a configuration file located at:

```
public/remotes.json
```

---

## **📦 Module Federation & Remote Loading**

The host relies on **Webpack Module Federation** to consume remote applications.

At startup, the host performs:

1. Loads `public/remotes.json`
2. Reads each remote name and its manifest URL
3. Dynamically fetches the remote's `mf-manifest.json`
4. Registers the remote so components, pages, and stores can be injected into the host

No rebuild is needed when modifying `remotes.json`.

---

## **📁 File Format: `remotes.json`**

Each entry maps a remote **name** to its **manifest URL**:

```json
{
  "remoteName": "https://remote-host/mf-manifest.json"
}
```

### **Example — Development**

```json
{
  "catalogUI": "http://localhost:5001/mf-manifest.json"
}
```

### **Example — Production**

```json
{
  "catalogUI": "https://plugins.company.com/catalog-ui/mf-manifest.json"
}
```

---

## **⚠️ Important Notes**

### **Development (recommended)**

✔ Use **http://** URLs
✔ Avoid SSL certificates during local development
✔ Ensure each remote app is running locally (e.g., `http://localhost:5001`)

### **Production**

✔ Use **https://** URLs
✔ Certificates must be valid
✔ Host & remotes must share compatible federation configs

---

## **➕ Adding or Updating Remotes**

1. Open:

```
public/remotes.json
```

2. Add or modify a remote entry:

```json
{
  "myNewRemote": "https://remote.example.com/mf-manifest.json"
}
```

3. Restart the host development server.

📝 *No build is required* — the host reloads remotes dynamically.

---

## **🔍 Troubleshooting**

| Issue                      | Cause                        | Fix                                               |
| -------------------------- | ---------------------------- | ------------------------------------------------- |
| Remote 404                 | Remote app not running       | Start remote on correct port                      |
| CORS error                 | Remote missing CORS headers  | Allow host domain in remote's server config       |
| Manifest not found         | Wrong `mf-manifest.json` URL | Re-check remote build outputs                     |
| Failed to load shared deps | Version mismatch             | Ensure compatible shared deps across host/remotes |
