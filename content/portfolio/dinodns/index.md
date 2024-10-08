---
date: '2024-10-08T17:43:22+00:00'
draft: false
title: 'DinoDNS'
summary: |
    An Express-based, pure TypeScript DNS server framework.
---

_For more background about this project, see my [blog post]({{<ref "/posts/dinodns">}})_.

[DinoDNS](https://github.com/jafayer/dinodns) is an [Express](https://github.com/expressjs/express)- and [CoreDNS](https://github.com/coredns/coredns)-inspired, pure TypeScript DNS server I authored to solve some frustrations I had with the existing DNS server ecosystem.

## Design & Philosophy 

The closest existing analogue to DinoDNS is CoreDNS, an application I took a lot of inspiration from when building DinoDNS. CoreDNS is a fork of [Caddy](https://github.com/caddyserver/caddy), a plugin-based webserver. CoreDNS allows plugin authors to create software that hooks into the chain and is called in series when handling DNS queries to perform various operations, such as responding, logging, caching, etc.

Where DinoDNS differs from CoreDNS is that DinoDNS is designed to be used in code as a framework for authoring bespoke servers, whereas CoreDNS is designed to be configured using a declarative DSL. DinoDNS provides an interface Express webserver authors will be comfortable with:

```typescript
server.handle('example.com', (req, res, next) => {})
```
This has a few key benefits: rapid prototyping, extensible plugins, and a familiar and lightweight abstraction.

## Implementation

DinoDNS is designed to be a flexible piece of software so that it can accommodate a variety of environments and use cases. It's generally based on the principle of [dependency injection](https://en.wikipedia.org/wiki/Dependency_injection) to allow users to tune and customize most components of the application, such as network interfaces and the internal router/plugin chain builder.

While working on the underlying library and core abstractions, I also began work on a higher-level pre-built server that can be used to provide sensible defaults and low-configuration apps.

I authored DinoDNS to be a relatively lightweight framework, while also authoring some default plugins and a few crucial plugins to make DinoDNS usable for real-world applications, such as the [Redis storage plugin](https://github.com/jafayer/dinodns-redis-storage).