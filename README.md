# truth
Verified Video Platform  
  
Load from CDN: http://bafybeih5xc3pkn4qii4xjgonlx5pddxeqwb72rakjcv5k63ahzyd2zaakm.ipfs.cf-ipfs.com/
  
![image](https://user-images.githubusercontent.com/3028982/158249340-3304f60e-f856-424f-96da-53f1a37dcf56.png)

## How it works

Upload + Transcode your video  
![image](https://user-images.githubusercontent.com/3028982/158249642-fffc49ad-8a5c-4732-a835-6f7ab0050a25.png)

Sign your video with your ed25519 key and add it to the longest content chain  
![image](https://user-images.githubusercontent.com/3028982/158249867-4badbcda-8384-4f47-ab23-201dc40fccda.png)

## How is it decentralized and why is this needed?

Videos are transcoded using decentralized video platform https://github.com/zodtv/farm and stored on IPFS.  
(You can run a farm node + IPFS node locally without using someone elses to transcode + upload your video).  

By signing the IPFS root cid of a video folder you verify the contents of that video, meaning if someone 
else were to produce a deep-fake or even modify the order of the frames the signature would fail.

## What are content chains?

You put your transcoded video on IPFS, great, but no one can find your video. To have your video visible
publicly you need to get a chainer node to pick it up and add it to one of its chains.  
  
A chain link looks like the following:  
```elixir
%{
    cid: cid,
    pubkey_ed25519: pubkey,
    signature: signature,
    prev: head_cid,
    type: :link
}
```

Chains can be tagged accordingly, for example a chain could be called CatVideos, another chain could be called VerifiedCatVideos (only verified signatures are allowed
to link videos on this chain), another chain could be called Democratic where the chain maintainer only links videos showing acts of democracy.  
  
Currently all posted videos are linked by the `all` chain that you see on the discover page.

## TODO

- [ ] IPFS gateway content validation (https://github.com/ipfs/go-ipfs/pull/8758) (https://github.com/ipfs/in-web-browsers/issues/128)
- [ ] Node finder + DHT for scale (right now bootstrap node is hardcoded)
- [ ] Chain selector
- [ ] Signing of other content like images, news articles, documents.

## Credits

- @Jorropo (Major contributor; idea to just sign the root cid; overall IPFS help)
- @kasim393 (Major contributor; UX/UI; styling and template)