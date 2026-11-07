# Weddy design

- Caddy plugins add parts that are not yet at Caddy itself
- Caddy plugins can use parts of other Caddy plugins
- Weddy uses xcaddy to add these plugins to Caddy

| Plugin | How it runs |
|--------|-------------|
| [caddy-gitea-plugin](https://github.com/wekan/caddy-gitea-plugin) | Gitea **inside** Caddy: the needed parts of Gitea's source, with gitea-patches applied, are in the plugin |
| [caddy-wekan-plugin](https://github.com/wekan/caddy-wekan-plugin) | WeKan **written in Go** inside Caddy - Go Pug pages, Unpoly, interact.js MultiDrag, Server-Sent Events, WeKan's REST API - over the same documents and `files/db/wekan.sqlite` as Node.js WeKan, with WeKan's own translations |
| [caddy-ferretdb-plugin](https://github.com/wekan/caddy-ferretdb-plugin) | FerretDB over SQLite **inside** Caddy: WeKan's database, also on TCP for MongoDB tools when asked |
| [caddy-rclone-plugin](https://github.com/wekan/caddy-rclone-plugin) | rclone **inside** Caddy: any rclone remote served as files, or as WebDAV |

```caddyfile
{
	gitea {
		work_path /var/lib/gitea
	}
	wekan {
		data /var/lib/weddy
	}
}
git.example.org {
	gitea
}
wekan.example.org {
	wekan
}
files.example.org {
	rclone s3:my-bucket/public
}
```

## Many domains: the Cloud Panel

One Weddy can replace a host of WeKan Docker containers: with the wekan option's
`data` and `primary`, every domain is a WeKan of its own in the Weddy process, in
`<data>/domains/<domain>/` with its own database, and nothing of one domain is seen
at another. The **Cloud Panel** - the SuperAdmin's table of customer domains with
their hosting dates, and a CloudFlare API key from which each domain gets a
CloudFlare Origin certificate, or else a Let's Encrypt one - is Weddy's, not WeKan's:
all the domains are in one process here, where Node.js WeKan would have to work
together across many containers. Its pages are Go, in caddy-wekan-plugin: Admin
Panel / People / Cloud on the primary domain names the Cloud Panel Domain and the
SuperAdmin, who keeps Domains and CloudFlare there. See
[caddy-wekan-plugin](https://github.com/wekan/caddy-wekan-plugin#many-domains-one-weddy-a-wekan-per-customer-domain).
