---
date: '2024-09-25T11:44:00+00:00'
draft: false
title: 'On building DinoDNS - a pure TypeScript DNS Server'
summary: |
    Some early thoughts on building DinoDNS, a pluggable, Express- and CoreDNS-inspired DNS server written in pure TypeScript.
---

The open source DNS server ecosystem has a few key established players: Bind, Knot, PowerDNS, to name a few. CoreDNS is a relative newcomer but has seen rapid success &mdash; indeed, when CleanDNS started building our sinkhole, we adopted CoreDNS as our auth server of choice.

CoreDNS is a fork of the Caddy webserver &mdash; it therefore supports a plugin chain based routing system, managed by a declarative configuration file called a Caddyfile (or, in CoreDNS's case, a Corefile). Of the DNS servers out there, it's by far the most flexible I've used, largely because you don't HAVE to treat it as static piece of software. If you have some specialist data store you want it to read files from, or a specific caching requirement, you can write your own plugin!

The innovation that stuck with me about CoreDNS is the idea of applying the flexibility adopted by modern, plugin based webservers like Caddy, to the world of DNS systems. The author, Miek Gieben, describes the philosophy [in an early blog post](https://miek.nl/2016/march/10/caddy-dns/) about the concept.

As a longtime TypeScript web developer, this resonated with me! However, there were a few things about CoreDNS that made the plugin authoring system seem... frictionful somehow (not the least being that, at least when I started building the sinkhole, I had little to no experience in Go, though I got over that).

Especially for bespoke applications such as ours, I began to search for a more Express-like interface for rapidly prototyping DNS server applications, but came up mostly empty-handed. That led me to wonder -- would it be possible to blend the best of CoreDNS and Express to write a declarative, plugin-based DNS server in pure TypeScript? With all the constraints and baggage that comes with a JavaScript runtime?

I set off to answer this question by building what I would later name DinoDNS. The idea was to apply a comfortable Express API onto authoring DNS servers not with a declarative DSL configuration file, but with a declarative code abstraction.

That is, instead of defining the configuration according to a config spec, one could simply instead do the following:

```typescript
const s = new DNSServer({
  networks: [
        new DNSOverTCP('0.0.0.0', 1053),
        new DNSOverUDP('0.0.0.0', 1053)
    ],
});

s.handle('example.com', (req, res) => {
    res.errors.nxDomain();
})
```
This would, essentially, be equivalent to the following Corefile:

```
example.com:1053 {
    template ANY ANY {
        rcode NXDOMAIN
    }
}
```

Similar to CoreDNS, with a robust enough plugin portfolio, most users wouldn't need to author their own custom plugins. For example, given a robust and efficient cache plugin, end users could simply declare in their code:

```typescript
s.use(cachePlugin.handler)
```

Likewise, with a storage plugin, an entire, working application might be described as such:

```typescript
s.use(logger.handler)
s.use(cachePlugin.handler);
s.use(redisStorage.handler);
s.use(defaultNxDomain.handler);
```

Just like Express, middleware and handlers could be executed in the order they're declared. Route handlers and middleware would have access to the entire request and response object, as well as a `next` parameter to delegate to the next function in the chain.

## Why I like this in some cases

To be clear, I have lots of love for well-built DSLs. In MOST cases, I vastly prefer that to an unopinionated framework like Express, where you have to make a lot of decisions about how to structure your code and attempt to build optimizations into the plugin chain in a sensible way. Because DNS is very often simply reading data from a database and distributing it (plus some caching) you don't often need custom logic in the middleware or route handlers like you do for a REST API.

At the same time though, Express sits, in my mind, _right_ on the good side of where an abstraction ought to sit. If you _do_ manage to structure your code well and use the framework to build yourself a declarative, performant, adn stateless application, then it offers you just enough room to dip down into the abstraction layer, write the logic you need, and get out before you break anything.

Take the example above. With a robust set of plugins, I find the `s.use` syntax to be a reasonable alternative to building your server with declarative configuration file. Further, because the plugins are "just code", you can (carefully) author optimizations right in the application without needing to develop bespoke plugins that hook into the framework's DSL ecosystem. To me, this feels more SOLID than forking a plugin's codebase and changing the underlying functionality.

Concretely, we encountered this with caching across many DNS servers at CleanDNS. Our DNS sinkhole needs to be able to serve wildcard records to be able to enumerate all the traffic an abusive domain has seen so we can learn from prior abuse. Serving wildcard records for EVERY domain can wreak havoc on your cache if it's storing every `123.example.com` and not simplifying that down to the `*.example.com` you have stored. With CoreDNS, there's no obvious way to fix this. Meanwhile, this sort of plugin was in fact very easy to build with DinoDNS, simply by allowing the storage layer to emit events that the cache plugin could subscribe to a la:

```typescript
storagePlugin.on('cacheRequest', cachePlugin.insert)
```

Configuring your server declaratively _in code_ allows you to author these kinds of optimizations in the same place you build your server. Building your software with DSL elsewhere makes these kinds of optimizations, in my view, harder to author and harder to track.

## Not without its downsides

Immediately a few things became clear: even if the underlying libraries supported a flexible, unopinionated structure as outlined above, probably the first thing I'd have to do is author a more structured framework on top of that. Most DNS servers have a few key plugins that dictate their behavior, such as logging, statistics, storage, caching, etc. I wouldn't want end users to be responsible for figuring out the optimal plugin order for these, nor require them to figure out the APIs involved in sending data from the storage plugin to the cache, or wiring up the logging plugin to be able to dispatch a log once the request is successfully handled. End users should have the _option_ to dip into the abstraction, but the framework should provide some sensible defaults if you're just getting started.

However, in many ways, that also clarified the advantage of this sort of architecture. Provided the plugins were authored in a well-structured and predictable manner (which can largely come down to building a good type system), the above server could be more succinctly described as:

```typescript
const server = new DinoDNS({
    networks,
    storage,
    cache,
    defaultHandler,
    logger
});
```

and the higher-level DinoDNS abstraction can set up the plugins, connect them together, and offload all the hard bits for the majority of use cases.

## Takeaways

DinoDNS is currently available on [Github](https://github.com/jafayer/DinoDNS) and [npm](https://npmjs.com/package/dinodns) and in very, very early 0.0.X stage. There are lots of questions I haven't really decided the right answers to. There are areas where HTTP requests and responses don't directly translate well to DNS and vice versa, so simply copying the API exactly produces some awkward behavior.

<!-- <details>
<summary>An example</summary>

For example, Express has methods on each route that allow you declare different handlers for all the different HTTP methods (i.e. `.get`, `.post`, etc.). This doesn't translate easily to DNS, where there's really only queries and responses. However, DNS also has different structured record types that HTTP does not have &mdash; if we only had a single method for handling all queries on a route, you might have to frequently `switch` based on record type in order to narrow the query to an A record or MX record.

Would it be better instead to define record types as methods? That is,

`server.A('example.com', handler)`?

Would it be better to define this inside of the routing prefix itself? That is,

`server.handle('example.com:A', handler)`?

These are big changes to how the API might be structured and what underlying type enforcing the handlers do.
</details> -->

As I work towards the first stable API definition for the framework (which might take many more weeks), I'll be also trying to figure out how to position this in the DNS ecosystem. Would I really recommend running an authoritative nameserver on JavaScript, full stop? Could I recommend it for CleanDNS, even?

A lot of this will end up coming down to performance, scalability, and how clean the API ends up shaping up. So, all told, benchmarking is probably the most important thing I'll be trying to work up!