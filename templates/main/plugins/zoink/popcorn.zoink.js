// PLUGIN: SPEAK

(function ( Popcorn ) {
  
  var styleSheet;

/**
  Popcorn zoink
 */
  Popcorn.plugin( "zoink", {
      manifest: {
        about: {
          name: "Popcorn zoink Plugin",
          version: "0.1",
          author: "Kate Hudson @k88hudson",
          website: "http://github.com/k88hudson"
        },
        options: {
          start: {
            elem: "input",
            type: "number",
            label: "In",
            hidden: true
          },
          end: {
            elem: "input",
            type: "number",
            label: "Out",
            hidden: true
          },
          text: {
            elem: "input",
            type: "text",
            label: "Text",
            "default": "Edit me"
          },
          style: {
            elem: "select",
            options: [ "speech", "thought", "fact", "fiction","icon", "none" ],
            type: "text",
            label: "Style:"
          },
          order: {
            elem: "select",
            options: [ 1, 2, 3 ],
            type: "text",
            label: "Layer order:",
            "default": 1
          },
          classes: {
            elem: "input",
            type: "text",
            label: "Classes (top, bottom, left, right, flip, pipe, fx)"
          },
          top: {
            elem: "input",
            type: "text",
            label: "Top:",
            "default": "200px"
          },
          left: {
            elem: "input",
            type: "text",
            label: "Left:",
            "default": "200px"
          },
          width: {
            elem: "input",
            type: "text",
            label: "Max width:",
            "default": "200px"
          },
          target: "video-overlay"
        }
      },
      _setup: function( options ) {

        var target = document.getElementById( options.target ),
            _args = {},
            // Minified icon styles
            iconStyles = ".zoink-icon-check { width: 160px; height: 160px; background-repeat: no-repeat; background-image: url(data:image/png;base64,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); }.zoink-icon-x { width: 160px; height: 160px; background-repeat: no-repeat; background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKAAAACgCAYAAACLz2ctAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAJ+RJREFUeNrsXQmUVNWZvu9VdTc7NA0o0upRBFlUlgDthkYjYyaZk4kmZpnJGBONJiaSqDkxmZhJzmSbTBJ1JGPOzHHDNSoBo6iASEaDIoiKsolNIgiyKFtLN3TX8t783/PePq9fv+Xe925VvcJ657xTVb1U1X/vd7/v//97738Zq121q3bVrtpVu2pX7apdtat21a7aVbs+LJdxJBlj23ZsewzDsI90W9Noo/FhBFu1dVYpba20nUYNcOnrqErZWgkwGkco6GT/z05LR2kAnaHDtnKD0TgCgFcKG+xydFSF7bTTAESjCoFXie9s6+yolNppVwKIRpWArxwdZutijTL0iVEpG3UD0Ug5+OKC0tDQKXYZwWgk+L2R4HvG+p1OEBpHAPCMEgQhtqZOZBqBZWgGoJ1kIOoCoVFF4DMknsu+nwqgEnVUAhtVQJhUiu1KAdGoAvD5gc1IwBiq4LIVOyrod7JsZyi0R9R72wnAZ5cDhEaKwRcFvLiMyGKCLA4QVdo/jm2GRvvcr22VQXokADCoYQ0JMKr6hCqsYJcIiCpgMxKCTxVoUT/TCkKjisBnxABnXHYI+pkqk6gyvNcGGduMEttXUhAaVQQ+md+pyLEt2Ul2AiCqsl+cwSbD8rL22ZJtoA2E2QpmYcLAFwVAGYBGRcFGQKcYnscodjEi3lPFv1UdeLJtG8c+v781fOxKfxTsw35JwWdo6KQoVlB9LsOCRkKbZf1HGdn1syXstWyQosSClWRAlY4wEgJRBYDukW4rjnSbyeclZcEWZaOKBPvZJMvyQUyYiAWzFWY/Q4IZZO4wmZYNQoIYwI4pO7ZCdGtI2q3C8n6MZ/jYJH5mhdgWJd09foY+l2XBNDBgmEMe545iCllnPOxWYRBZ6VWxTXaQydqGy1TwCbX4f5UAoI6OMGOAMGkH2RGsGGSrLeHvxh1gYSzox35h9lmKahHJgqkAoMS6tyDWYxLgM2N0lA7wWSFgC/IHw9ItqoNLVYLD7LNc7GdFyLifrYGgk5XhbIXZL6gBZcGnAkIZ/0+8tkI6zJSQ5TC7mAaGN2JEwGG2WD4gtCVSWFUnwWHgNBRZ0AwAJgvpKBkA2h7HPAx8lo8/aLDwmRCvfWYMpg9LwNsJwGd6bJINsGL7hSUDoKL8RgEyCHTm4cOHMx+knozun/PnUcFIr+i3oaGh6ANEy+e5HyBZRMKWSUpvKPg6OztNbp+Ue4HLbROuvn37Mh/whUm7HeHnVhUDyqRcZDqrG3y5XK77UXSOu5NcgPQOEru+vt7pGHq0urq6nAYlIFoBwGOSUqziWkgxO3237sFFdjpMLx6FjRxsPUBjf3BZwkb+3HEzOBAt1+f5ATFohicSfDJ+YLYCoIv6nYxv5ICPOgW3mc/nzY6OjkyhUHAA6L38QIheqaurs8Vj//79LXosApAAIoHQmx/ze4yKjm3J9FKYf9sNPgAON9lqkq2w2/AbXAKItuvKZrNFuh0b8T9kJ6M2ZByEbiAakmyuZUquZFNxHglWjQLdj6b3tQAfdcLQQYMGfTaTycxyfZ4hs+sM/Ubv8+zWrVsXWpZ1oE+fPkXqjCKASDek2OJMKEBoefzCKADaEUzPQvzYHuAD6AhsGdM0m/v163cR2TudY8zgbR1qK9n3zrvvvnvf9u3bN5JNhcGDB+cHDBhgUdsVOBMWXTZ6bY5jr+1qZzttEhwFylCgEmiczkHHDBs27EZ71eqLD99xN7PfP6j04WbzKNb3kounTjx9xtc2b958ze7duzdSh4BS8nh/yBU9FjkImYv1/PzHoGAkzB4zauC5wQfg0Xf5Xm7egoGHFz+tZG/2jJapzd/51nmtra2fev/99/eBOaHg9H4m3bYPEdgB+cyotEw6fMAEG67DUgzdvwP7oWPoamm/eQ7Lr1gZ63t2PTKfNVxy8YDRv/nlnLa2tsv379+/DfJEzFoklihAplxybIUFMAHpnDgAFAMsA9cCbgWx8wUNudxP2y+9Ipat+B/YSQP21DVr1rzIA5EiWBADDIOaXtsB7oHtk1TXNhtiVpD1VCPhHuDknbMJTJbkAghzd90z4LTTTvvle++914C7vb09e+jQoQz5WlnCo8mDHAGOjMc1ED8zfNwGM8iN8PnbjIv54MuC+bL0vJHA8e+HfvLz2AMNbYR75cqV24gB68iuergxZJch/MuAgS+zCicRGZUbgDoCFkMEHnv37r2/309+yIxBgxJ9IDo30/rXE88555wrDhw40LBv3756dBJACBAEgC8IiGEA9Pv/Xv9D4AM4Mvh8Yq2fdt05dyAGStyr309uZNu2bVu4ZcuWXGdnZx3dRrFYdNrQlS1QXcihJX4wUww8X8cdDUaS5Pxi48aNL3fW1T3X/6ZfJf7w9utvYCNGjPjn5ubmCQKEBPQ6DsJMAAtmFMDn/rtMADCdz8HnEUNlyQ24gFB47uGb5sS2i6SX2R+duee+++6bJ9jIlR0wJJmtZMFqGhmQseg1b04aIZvN2suXL/+Z+bGP7kZDJ7mK6zeyw+RPkhRfTwDsQ3cd5IrYIgumEOCICbKMBCN2Sz0+j+6hFI3/uOO6GyjgeD+29EIhFi9e/D8UBXcgsKL3tGkAIyfIeA7Um6IyygnEtAIw0ng0HjUmI6ls27Bhw6/Q0En9wcM33crq/vrWCbNmzbqUwNdAIKyHPwg2AisFsF8mQmalwCduSD4+j9j4x/klzwzILV4a254BpAxv7dmzZOnSpeuRZqL2KiDF1NjYiNSLRT9DgMUASFahPeLVBEDnQmMhdYCGQyOSTBVff/311Xu6uh4doEGKD17xDXZ0//5fGDt27EcOHjxYT3cdpBhOOwU92RAWzETIcCh70vtmufRmBg4c+DGS3nPAfrHb6fLLWGHKpL3333///H79+iHiLdD7Fgh8BXru5DsFA6okOD4sAIw0FABEI6IxhwwZUvjLX/5ytz1t6rto+CSXtf0dBp9r4sSJ3zFNc0hbW1u9W4o9UbEMC3r/rpc88ylEMbvRSIC5Nqn09r3uGrZkyZI76LsfpPfL00DNDR06tNDU1FQcNGgQ2s0ZyJz9SidbEYlos8wfqlqTxTe7zn0Yx59BY6Jh6dq/bt2636Lhk0px5x13M2P1K8NnzJghpBipC0ijEyAALBJM5wVbIAPylIsTeJAtV1orXzpag/Qufe6559YBfAS2PJiPwJfHYIVquNgvVjUEXWxoppDppAvnoBHRmNS4RTQu+YIvkxQ/pkOK24mBhjU0fHL06NFTIcO4CYR1HIR+PqFqGsZ5jfcR0ktgmU6h9yXtGqT3oYceepQGqpBdADBPbVSgAQs5dhZhuGZ5VIGljTXTIMFxDHbkAyyIxkQjo3HRyCtWrLhHlxRDBikq/gExVBNSM4cOHUJiOAup5AFDRjLq9Q1MxP/j/ehuJFtuhPzjs5NI79NPP30XDZj34fcR4HLEenmX72fzaUa/9lWtmmVXMwBl9uXaEb9jQorRuGjkYrG4f/Xq1T9DR2Qmjk/0BSGDhaeX9Zs5c+Z3IMPkD4rUjLPyJqEEC/Bl4F8SSK6A9EL+E0rvMy+88MJ6RLyQXiw8IFkH++XBfnV1dRb3oS2/9gx57ecWycp1xQGo4lNE/c52saDTiGhUNC4aGY29ffv2N3Z1dPxhwG+TSzFYcIBtTz/llFNmEgAb3FIM8LhYUOnG/+H/8T4klZDez+qQ3nnz5j2GFS99+/bNUZt0IfiAMrgiX4szoAzQSl6SuGQATBiI2BEjs/tnokF5RNzt7yxbtuye/OgTtvS9bnaykUORaPsVV7OxY8d+i96/ef/+/fAHswhKuHRmAvzBUPAJ6cX70HefrUN6ly5dejcxdBu9H4INJ+AQ0otUjGA/Jl/3JkmQIlUhIS0+oEyhoNDthWhcrPBAg6PxiQm71q5de3Pfa5NLMRYB5O66p9+0adNmE/gaCIQNkOL29vY6H3/QK7+++UEuvZnhw4dfzt54c7QG6V0G6UXUCwCSXwzmQ+oFzwtYdCsGLFPffhpVjqQqfECZNItslYIeCyRFoyKyQ8Yf6/qo4XO7du16g24tUgyG6rv/wITp06d/Gr4gZBhBCfw3vhJbaooOf8vBZ2az2XH0fb+Meeik0jt//vzH+ILavFd6CZRYCW0FgM+SkF87RsaiahPRssBj7tdoXDQyGptGfJGnZ3LLly+/p3DSiVqkGP7gqFGjLqH3bhbTdFiZw9fu+QUmPZZoCbbEI6JpAsr3Mf+MeeiE0jsXUS/3+3IIPKACAB9AyaU3qh1tRUnWEgmXFICSfmDYiAuTAm+jWhyEYmm9kwMDE6xbt06fFN96W7+Wlpbv8Wk6MVWXxfImmOwBYS/5xe8BWBocX4X0Yv45qfSuWLFiPcCHqNctvfCJBfiobYpB7SYpt0ryK1sbJm2J6EhfL6DBevyMsyDA5/iDJMObKDK+Q48UOwsWjj/zzDO/iNQMQIglWzw/mPFhP0MAU0hvJpMZRYC4WIP07oP0IuEM349sDpLeokQbyuz10M6EZgUBJzv1FlUmoxcL4hFON5+CQiI2t3LlyvldJxy/HqtmEs+SEHBGjhz5mREjRowFAyIYEVLMgebrA7qk93udt/yuf1LpfeaZZxzpFeDjkS+CkCJAiZ1wnrayQl7HqYmT/kS0BBWryK9f4/V6FFIMBuCLFZyc2CuvvHJz/Vcu7ag7oyWRTa61g1fTy0aKiLMAIdiNQGYIqXXLLn4OgGIXn7Fz12mdtyePel988UVHeglwsA/gE+yX51FvudgvlvxWSoJVWVCGAX0fwQDcHwQI8xS9bt+xY8cfsII66TJ+SHH21deOIxB+ngAoVszUYVkVB6HB84SmAJ9pmscQM30pyUoXl/Q+TuDKi5UuGGAAIPw+n6g3akuppcCIMv1YdVFw1O4yZRCKkY/N2CJBLaS4c2jjekhYYin+YMHChc3NzZORnBabmdzzxbgpQMlw9vtu151z+yfZXOSS3jYhvWK+FwPNFfVG7fP1k2GZWRCthxmWBYA+X0qGBZV8vyAQ8tRMkUuxwxZcig8llWKxdnDcuHFXWZbViKCE7zYD6HAb/Dbp8z9O0ntqkv0dkN4te/c60ssTzl7pLfBqD96cn6r/x8rBfmnLA0YlO/3AZsnIMZ8lwXJ0pyqATinGDIa97NlhU6dOvQwyzJduOSuneekQAHIQff7XdEjvH//4R0d6kXDGYMItcn4YaHA7RCAWwoIyAztqliox+5UVgAosqBqRRQYkYAQeFRdEVLxq1SptUgxgDclkzh49evTpfJYkCxAiMoYk0+ddn1/yjFbpJQB2iqQzBhYGWIj0ygYfMjMh1RUFawpQVGS5l88DEIIZ3FIMp/3ZZ5/9GaS4/sILtMySnHTSSVeS3A7Zv38/gpIswEjAOCtz6FBLkv0dQnrJf93gI705H+kNA18QO8qUIQ4EX9yjusoKQEUWjMuGgQ0upBggBHOQ37a/tbX1Vh1SLNYOzpgx4+uYpgP4iAGHEFBma4p6FzY0NMhKb9iAVK17XdJlWWVnQAkQyjJfmJ/Tq8G9UoypKjju69evX95uGC/p2NzurB18/+CUyZMnf2Lv3r31J5544rcgvXH3d/hJL333LiG9nrneKPDZTF/SWQv7pVGCZQISWQb0lWKxbAt+k4iKn3/++Zuzs87XJsWjRo369Pjx48/vk89P0yC9fxbSS7cjvRg47rleXmhTtqxakPRGzUgdGQxY4oDEDoiM3SVqe4BQtxQj0MjffW/fMWPGfAU1Z5JK74IFC8Rcb84tvTzwKLrmesNSLVZIzi9R4JH0xPQ0b0xXleaovFdQVOwwyoYNG57XJcXI9SE9E7egkJDexx577Pft7e3Ovl7Irrjd4BPldyVsl1nUUTbprTgAJVlQdoYkzNEOmit2ylMAhC4pvkWXFIP9kkjvph07niT/dCt9R8fvE8lm7IGWiHpVFxuUXXpTwYAlluJQZ1xIMa+Z4kTF9DNsbv8PsGDSze1xL0hv56kTtz/wwAN/Aviwvk9IL26ADwPHNdcbN+CoqPRWgwSrgJKp+IHMtYyfFyjvluK33nprzZ6urid1bG6PK72LFi2aC7+PwAZ/rwvbC/gqZyyz8pNeXYsNSprzSyUAy5AbDAQlOtIlxUVetiL/6quvPmhPm/pe0s3tcaT3zZ07n3rjjTe2Cr8PAESyGQXFcY6J4uYi1cUGZdmKmToGjAChbEDCWLx1b7aQYur0gpBiAsF/66gzI3thzwqk96GHHoL05kh6xUyHs7WA5/wsMWhCmD7OlFtZA49qlWBZ4NkqbCkYBcUuxTQdOn3Lli2Q4qfKIcXYq4I9KyS990J6eXpIJJvx2hLSG7DBSCbKZazEK1uqGoAxlmz5AVQlad2DAQFELsWoOZh3SfGeUksx9qps2rTpKbq3IPDAZ/PZDtR2yfPAQ2lgReT5pM74KDX7VQsDRjFinI7wZVGwoJBifmZIW6mlGNJ7+Phj33nkkUceF/VcePAhtlZagqUj2I9J2M4U2K/k4EsdABV9wSgfUQaozEeKGTqdV1jIbd269bVdHR3zSyHFQnoXL158H5deh/n4Zxf45iKs5LE9ZTXCUlRxB+eHW4IV0zGMye/UtyVAygQIsYQfBTDhdyHtgYJHq1aterAwZdLbSTe3B0jvotbW1i2ipAZkFwEIVrgI8DG5SlUyjCfbtqwc7FetEpxUTiJBCrZB5S2AAOkPyPG6detuA1vpkmKX9C4U7CdkF5UdwMJgYxc7s4gAjCk8qrZRjQFjMGOsWiais8E8kEDsMMPjsGHDmjDFpnomXdDV5/Ivsw0bNjwrFkbA7xTpFrBvJpPpDo4k7dHGeDUJVm88WxZgsp3A5dipQUiy2Pe44467OsnCUu+FBQuTJk36+PDhw/uIPcyQXH4CAIAX9J3jMpedRiAeCQxY8uuEE064tvD0sv5JCod7L6yWybyyZuiFF174SWI7ZpqmDdbDXeLBmqqrGgFohPws6swz6QP3sK8X9fvI/zu7rrPzjCQLS4Oug1dczY4ZOPBjp5xyyjgcocq3cxp8Y3up2qoGQM0Nayg2fNj/GvwsXZzGiSUzA8kf+65O6e1BT3wF9eTJk79NzDcIO+ja29uxlRPfg/HvIXOusqrdqQFo1R7VxdQO2ovqtB6/x4E02FLZ2Nh4Q5I9HTIX3ru49M8ohP6NtrY27KQT1RVMfkadLIAMBVClhhlTBUCfs2UNRXD6nrDJfM4b9gMw2IZLr0GR6czMoUNnlkJ6vRc+YyBjHxk3btwZBw4ccEDY0dHhfA9+epLMafJM4jFqQJcdoNUmwUYIe0WesBnWgbyT0eEMlQwoKr2hVNIbJMVjx469CseDoRA6P50JVbXcrkHoAJIAX6xTMKMOnT4iABjBfrLyayjcvYB4+PBhA4FHU1PTv+bmLRhQSukNkuKzzjrrm0KKAUB8H3yvCOBFMX5UG1RMms0qZr8k4Otxw9cSpdRIes8xd+0+K8mejiRSPMgwPjJhwoSzsLEdNwUl3d+N+4QyA8pQUAIZSS4ZC5pVzH5abn44tEksY9L3GEVR7w/KJb1BUnzyySd/3TAMSHEWUozImAIT8V3jMLysfIe2fSlAaKYQfKVkP9MLPu73QXrNIUOG3Nh159wBSYoI6TgeLH/3vf3OO++8G1D4EizIC6FnROHLCCb0tTUiOKtJsGSKRJXhTJ/O6PEzzn6oWv8FY+euSUnr9w28/fcaqq86Z5KMb2lp+RQASEzo5Af5SZ1mAMhMFs//NRQYUTsLmiljv6hGSCK3ZpD0ZrPZ5j59+nwlaRGhw6dM2PFeXTZxIXRXiY/PDR48eJSoOQgWxPfF98asiYSdMiwoozQli4rTHoQYEWmUWOzHTzx3QIgok6T3h0mll2+n/MPDDz/8YOaiTx1Ourmdl/joN3369GuEFCMy5ie3G/zkdjPAVlNCkg3JoKWk0mxWAfuxGEwX2iG4BPiGDh0K6Z2cVHo37dix5M0339xGDHXwpZdeul9PIfQPjgc7/fTTcTxYPS9+6ZXiKPCZAb9jIfIbmaLRxYJmisEX5v+xAKYzQxiwm/2E38el96tJpbfz1Ik75s+f/6SoZPDaa6+tbrOs15LWmRFS3NzcDCluRtFL3CiCTlGxc/wDZ8Egtpf1C2MFJDpAmFYJVg1EzAj57Qafm/10RL38hPL7RfFIvqcj99xzz92eueC8Q7qkmAKSbikGCPH9faRYJTgxmZwcl1SKzZSyX5TsmjHkV0S9joSR9H5Rh/S+uXPn4s2bN28VlUtxTCzdnXV1dagzM0dHnRkkxftseXvCGWeccRGkmE/TZcmOLJdi720EPDdZ8PRlRaTYTCH4oiK0oIjYDAMhWAKSBekicOiS3ncWLFiwENLLC0c6FayGDRvmPO7atev1vbncEh076nA82PHHH3/ZyJEjT3ZJsWOPJyo2Q/y+IDBGKU7JpDhtEqzCgGZIY5te8EGqIFlcen+kQ3qXLFlyH0mvUy4Nvh9ACBYUp3Ti9dq1ax/RsbldHA82ZcqU2X5RMbczoxAVp0KKzZSxX5JcX5gjLnJ+2aampn9ib7w5OWn9PpLeRSS9b/PTirrBh110vLKBA0LTNNsoOv5fHZvbxUmd55577pcIhA1imk4cmh0BvqCgRCYpXTIpNlPGflHSKwu+buC5pDdTX1+PE8q/mvSYVEjvvHnzHqf3QrVSADAvioZjK6fY0imq8e/cufM1kuLFuqT4mGOO+RykmCeocUadkOKgqNiUUI/EUpxaAGrM+ZkhqQZfv88rvZ23/G5A0mNSvZUMBANCilGvGWXU8IjX+Dn+5sUXX7xLx+Z2PynmByV6pdgMAFxchWGlYEEzpewnE3BE5vxc0puhwOAqe+Omk5KeUI76fahkwEuoCfA5NZsBvEwm4+zpBQviNQehU+Zj48aNt+k4ud0txSIqDpDiyKS85KxImEKlmwE1LDSNNeshEs5cesdjrleH9KKIkFd6cWNjOQEPB8Z0VyPFawBR1KEmoLTu3r17vo6T251DswcM+BzJsZDirIIUmzGS1qwULGimnP1kc4G9wMf4eb04QpUA8iPIVlLpXbRo0T3uhLM4MAanL4HtsJEdAHTdYMICP53JCUpefvnlBwonnbhVixTfNIdNmzbtBxToNIIJuRRnXFIs6w9GBSZRAUnVJKJl2U8l6PDNf0GKIL1HH3301yjq1SK9qN/nOq3Iyf25wcc8Jzfh+CwOQlQ3LYiyuyTFv2v49jcPJZVibG43Vr8ynEDolmKRmlFhQBm/rySrp0sKQIkvIrvJKCpv1f0zjHpIEKRIY9TbXToXB8Zw6c0J6RWyC8AxnyPEeCX+PM8PFvbs2dNKkfEjOtYO8kOzPzl69OipQordawdDcoOqawhLsofETCH7sTiy65YcSBB1Qh119r9pkt65OKNXnFDOzxVxwMdLqBU5+HrV4BOg5MWOCvykIxya/Wjn0MaNSY+LFYdmT5w4cTYN+MZ9+/bVY5qOS3EPlyQBCGX7sKrygDp2d/VqUBH16pJeHBhDkimiXkd6Efli+o1Lr5f1iq7bLcVOvT9RfRUgXrNmza06Tm4XUtzS0uIkqLkcZzkLysyOmBFsV7LpuZIBMOQL6Nhi2avBhPRixTABY7wu6X3wwQcfFcUjATywF1gMbOaSXr+TO3sdGggQArS8FFuOWHo7SfHDOtYOCikeM2bMFGJBZ66YS7FfVKwyDaerNEhFGTBOhQPpOUsxEQ/phQ+kK+p96qmn5iLqJTCD+bp4ysUBn0d6ixEAdP4Oh8sArOKkTtwUFS/oGDxoddJl/JBiTC9CiikqbiIGbEBUjPYQO+l8VlDLtK9MRFw1UXCS1EsoMIX0jhw58kp71eoxGqT3ifXr1//Ne1Ag9/uKAQFHMew16gByKRYndTrv+cILL9xS95lPJ147iMMR7WXPDj/77LOvREQsEtQBK6hVXR5l4MnIcKXzgDLGhAKTRrXBE86O9Dbkcpe3X5dceh944IFHRdTLq9Y7t1t6AagI5vO9uRQX+DKuHA7GaW1tnaNDirHErDGb/eikSZNm4tBslPkgFnQv24o7DWdoULjyAFDB/5OR38AcoZAUDsJGAsivERFCjpJI75NPPnkXgSvHE85d3jN6ASAf8AWBsRcL8kdLHBcLYG/YsEHLye1iGf+4ceOuoc9oJAAChPWQYgG+kB11hmTfRPn0qZJgmS9sRCSjg16jkJDDfk1NTVdZK186GhFhQuldSNL7lkg488hXSG/BJb1BElz0i4Rdz4t+Uqzz5HZeZ6b/+eeffy3fV9ydG8SmJqZeR4ax+KXgUusDquYJezyiiCPARw1qEFBa6ru6Pq9Deu+9994FkF4ChrPQgJ+i6bChmO1wsZ8f0MJYsBcb8tPQkZrJFYvFfWvXrv2FjmX8vM7MjClTpsyEDJMcZyHFvBIr2i9qeb5Kf8X2A9PgA8r6iD3AJ6S3UCg0ElB+rEN6n3jiiTsR9bpyfl0i6uUnlBc4+IoRICsGgc7NgiKFg9ORAHJI8ebNm1/d09X1xABNUjxhwoTZ9FmoM1NPIMTSLTFDIkAYRgIq+b+qTETL+hq9/hYNCPYbNmzY10l6R2qQ3seJff7mAp/b73OAx8/o1XU7IMQNcPPUDKLirlWrVt2j47hYIcWzZs26HhExpHjfvn0Zei6CkVhJZp2XdgAmDEAiGwBVQyG95NNQwDgI0vtFDdK7be7cufNdc73d5/SCncBSAB8WmUbMehQlWbH7pvcVICzwk9tzlmUdoKDkFh3L+J3qqwfbW2bMmDGTwIfUTIazoJBi2Sg3brXVVKdh4uW7qNGo4wYTUP5dh/QuXLjwDsz1IuFM79kJFuIplzyX3qILfDLRrgwonRvvKxLUSPdwKe5qbW1dTVL8uC4pHj9+/LUjRoxohgyj2BGA6AJfWCZCa9qlqgEI9kOj0W0PHTr0IpLeY5JIL1ajkPQ+9vrrrzvSK5LN7pSLJ+BQTrvI/A1ACP8Sn8cXrzr+4JIlS35fmDJpS9K1g9j9V5j/p/7Tp0+/FCtmUPQS9QaJAZ3BjHYtoR9/RADQ9vp/1GHnJwEfIs3Dxx+77fbbb59HAOgiwHUi7SKkF0uuBPh8pNeSBF+UBPeKiiHFfLUNQNhJg+M3Dd/+ZkfDJRcn8wcfmc/IjqMAPp6YdiSY2Ld2WqYM6FyvbYzcYrG4o/6Szyj7SFgEOujh+1j+7//u7Tlz5vwcy+sBPMgfdXoXT7nAF/RKb1A6JdZsiBeI4nP4QYnOci9UWXjnnXc2rly58vt9fv2LDswXx/EJMbtSTwAmv68Dq8T5wg0MZHfbRp0mWpIrm1Lg2ZzaezQCRivJhfN8/fr1/znmrNOzQ1b83ycU/cc9f92yZfmfbrvtSWKDNvh7fI1fJzoc0ivA5wKYd7Wzu4MsFn5QoNevsvnAt10E4PwNgdB5D/p8BAl5AgjsNbZu3bqRfLbZ0//xH77UeNm/tGQymX6qjUq+30v3zp37XxTg2LhFe1J7MAJ8FOhin7lXUv2WjIKjVjgHLbPvdSOTj3IUiObefvvtBmKHvu+++26/PXv29KGOaqCGzdLniy2JOH/NwN1N96bpnMlmGEaRL5N3pK6pqalz+PDhXUcddRRqu8D/cwCIDUUugPkB0GLBZxKzgJxa6D5mnt90ZiywoYrsqyP7GnATiBro5/XUDnVgMlKBDN3dbe6WUxfQsDnKIrsxk9PFbe049thjO5ubm/E6D/aF/+njHvjZ7XdqexCLfmB8yHnD2TIzmxHymgVIQC9j+RGnFpa4U2d04Xw1AqCNThEd6QWfaAgAECdhwukXG4WoExzgwe8DA3IZLPo0ehAAWQh7GC5bvekM2+MGOa+BI/oeznsRMzvAou/tLGJoa2srAJhkK7Zg4m8NAprhBp4AogAgbvp/zLrkOOM7+1h4bjPyNPkY7lLlJBidrLApxQ1C29NZzKchnA0+iNywqhiLLbl0WfSzHDYi0edn/MDn+H+ZDBMAFvs0+J7dgtjby6U3bORbYYPDpzPC5rJN/n7MDUYc2QppJMBhgIil/TaYCnPUUAJiSRQncuzEAHS7KV4mRK4R4KX/L/ADsZ2T2em1zVk+yBbm0w9MJyAr5QP6gczw8f0Mt/FgPRzawvfaWgQ2LI3Hc+qDItggQw1uGvzy+2Ccwws24RJsgw3g80F2AWQBch/GiwNAvwElQBd0opHzNwAhxoz4TsgTYtAAOKjoj2k02MxPUupxCR+PP3c2ysPtgBSLjfKihIho1yjVKVVAUpJpFw8Dqiy3D/WNPL4gOsGZ14S/hEdHd13gCwGh06FgQrAAOjkAfEHAk2GNMB8wspimsFUsGkDkyqPX7oN1eIFK75ZI2/1oCU2mC/Zi4QO3WfjBgVsIJAZfUPBie1WxkgAMC0QYC18eHlhwESBkrh1f/BHGmh7wGX7ygE7AcxfwrAiwBUW/dohMqWwxDd005AYiz4WaQQPMBUDb/chtBfs7U4su8Mm4HJaCrygVgFQCgH7ziiqMYHhA6ICSd0SPIuQ+n9mrgdAp2NsRAqwoALIYUTBj4WWFQ+u4uJZR+QHcz2ezvYFGAPjiuBxBtlcWgAllWIUdZM5OY2Gd4yMjlgQYVX0k1Z1+QeBkTH6pvIx9tiTjRaVeYslvWhLRYakL799YLife7cyr7mGwJdI9MqwnK8F+0b4XYJZPstoISOPEtZEpsnyYb6slKMmWEWRGxHMWknuyXPkyFfAZIY0WF4QyuTJbMhfqtk/1sEFZCfYDoaVopy3Ddn4puTRPxfmlYvzYLwiEquBTkeEg1rNCWCUOM9ghclyUlN44TM8iQKeSakq0mKFkAPRJSEexoMyXt5j85hlDolNkQRjFfKqdYLPg9XbuvKgVAr6oRbwqdlohzBj1vlUhwVEdEcSGKswh0zF2TBZkCgCM4yd57bFY9DZV2SBS10CzI0CoFHyUBYCSLKjChl7m8HacrRDZR3WMTLAhy3wyNrEIm+KUSLMlomKmOOjYkcqA3qkrWxJ4fp1oKICPKTBcVNTr99rPPtXBZSsEIFEyzJg8q8vYG5v9SpoHVEhMB82QhG1WZzE7RLZzVIFnK7a1jA2q5XGNiIGgAsIom0NtVwFgGhYjqAYitg9TellGNf+oAkYV9lNlwahAxQ4Bsy1poyrIZBgwFvjKxoABLBjFhLIsl9QvkvGXWEL2Y4rfW4edcQab7N9qYb+yAlADCGU7wVDsEKbQEbrSEKpAjGtnHEmWHWiJwZcWAEY1riEJ1CQAtBM8jwK2kQCIYSBMAkCV51J7ROKAr+wAVAShSuPLvKcKaHQAT6W9k9hpKA62uANQO/gqAsAYINQtRaqMqAN4abGTSQJNemdcEvBVDIAxQajaKYYiYOwEf8tKCMQ4f8tiAkppoCUFX0UBqBmIKr9PAqxSbdQ2SvC7ROCK+p0O8KUCgBEgVPmOcWzRsuVQtjMkT44qdb8lslkX8FIFQMnOKff31Qa8KrC1pPZWBQAVO6cU319+/lJTR1TQViWbSwG81AIwZueU/CplJyS019A1sMptc6oBmAYwlqMD0jbwym1zVQCwXJ1UCcBVGpCVtrkqAaijo9IItnKAsprtrl21q3bVrtpVu2pX7apdtat21a7E1/8LMAB1bT3OsI4eYQAAAABJRU5ErkJggg==);}";
      
        if (!styleSheet) {
          styleSheet = document.createElement('style');
          styleSheet.setAttribute('type', 'text/css');
          styleSheet.appendChild(document.createTextNode( "" +
            ".speechBubble {\n" +
            "  opacity: 0;\n" +
            "  font-family: \"digital-strip \", \"Open Sans\", sans-serif;\n" +
            "  font-size: 16px;\n" +
            "  line-height: 1;\n" +
            "  position: relative;\n" +
            "  display: inline-block;\n" +
            "  border: 2px solid black;\n" +
            "  padding: 10px;\n" +
            "  border-radius: 5px;\n" +
            "  min-width: 70px;\n" +
            "  max-width: 200px;\n" +
            "  box-shadow: 3px 3px 7px rgba(0,0,0,.2);\n" +
            "  background: #FFF;\n" +
            "  color: #222;\n" +
            "  z-index: 1000;\n" +
            "}\n" +
            ".on .speechBubble{ opacity: 1; }\n" +
            "\n" +
            ".speechBubble.full-width { width: 100%; }\n" +
            ".speechBubble.connected { margin-bottom: 15px; }\n" +
            ".speechBubble.fx div.text { text-align: center; font-size: 45px; font-weight: bold; padding: 10px;}\n" +
            "\n" +
            ".speechBubble .canvas {\n" +
            "  position: absolute;\n" +
            "  -webkit-transform-origin: 30% 0%;\n" +
            "  z-index: 1001;\n" +
            "}\n" +
            "\n" +
            "\/* HORIZONTAL POSITIONING *\/\n" +
            ".speechBubble.right .canvas { right: 15px; }\n" +
            ".speechBubble.left .canvas { left: 15px; }\n" +
            "\n" +
            "\/* BOTTOM *\/\n" +
            ".speechBubble { margin-bottom: 60px; }\n" +
            ".speechBubble .canvas { bottom: -59px; -webkit-transform: scale(1, 1); }\n" +
            ".speechBubble.flip .canvas { -webkit-transform: scale(-1, 1); }\n" +
            ".speechBubble.thought .canvas { bottom: -65px; }\n" +
            ".speechBubble.long .canvas { bottom: -58px; -webkit-transform: scale(1, 1.5); }\n" +
            ".speechBubble.long.flip .canvas{ -webkit-transform: scale(-1, 1.5); }\n" +
            "\n" +
            "\/*TOP*\/\n" +
            ".speechBubble.top { margin-bottom: 15px; }\n" +
            ".speechBubble.top .canvas {  top: 1px; -webkit-transform: scale(1, -1); }\n" +
            ".speechBubble.top.flip .canvas { -webkit-transform: scale(-1, -1); }\n" +
            ".speechBubble.thought.top .canvas { top: -5px; }\n" +
            ".speechBubble.long.top .canvas {  top: 2px; -webkit-transform: scale(-1, -1.5); }\n" +
            ".speechBubble.long.top.flip .canvas { -webkit-transform: scale(1, -1.5); }\n" +
            "\n" +
            ".speechBubble .pipe{ \n" +
            "  background: white;\n" +
            "  position: absolute;\n" +
            "  width: 10px;\n" +
            "  height: 30px;\n" +
            "  -webkit-transform-origin: top center;\n" +
            "  -webkit-transform: rotate(-15deg);\n" +
            "  border: 1px solid \n" +
            "  black;\n" +
            "  border-top: 0;\n" +
            "  border-bottom: 0;\n" +
            "  bottom: -25px;\n" +
            "  right: 35px;\n" +
            "  z-index: 1001;\n" +
            "}\n"+
            ".zoink-didyouknow {\n" +
            "  position: absolute;\n" +
            "  background: blue;\n" +
            "  width: 100%;\n" +
            "  height: 20px;\n" +
            "  padding: 2px;\n" +
            "  top: -20px;\n" +
            "  left: -2px;\n" +
            "  color: #FFF;\n" +
            "  text-align: center;\n" +
            "  border-radius: 3px 3px 0 0;\n" +
            "}\n" +
            ".zoink-didyouknow.fiction{\n" +
            "  background: red;\n" +
            "}\n" +
            "\n" +
            ".zoink-didyouknow.fact{\n" +
            "  background: green;\n" +
            "}\n" +
            "\n" +
            ".speechBubble.didyouknow{\n" +
            "  border-radius: 0 0 6px 6px;\n" +
            "  min-width: 100px;\n" +
            "  text-align: center;\n" +
            "}\n" +
            ".speechBubble.didyouknow .text {\n" +
            "  text-align: left;\n" +
            "  font-family: \"Open Sans\", \"Helvetica Neue\", sans-serif;\n" +
            "  font-size: 13px;\n" +
            "  line-height: 1.3;\n" +
            "}\n" +
            "\n" +
            ".speechBubble.didyouknow .text img {\n" +
            "  width: 6em;\n" +
            "  border: 1px solid #AAA;\n" +
            "  float: left;\n" +
            "  margin-right: 1em;\n" +
            "}\n" +
            iconStyles ));
          document.head.appendChild(styleSheet);
  
        }
        //TODO: if not jquery add jquery

        if ( !target && Popcorn.plugin.debug ) {
          throw new Error( "target container doesn't exist" );
        }
        
        speechBubble( target, options );
        options.callback && options.callback( options._container );

        function speechBubble( target, args ) {
          !args && ( args = {} );

          var container = options._container = document.createElement("div"),
              width = args.width || 200,
              top = args.top || 0,
              left = args.left || 0,
              i;

          container.style.position = "absolute";
          container.style.top = top;
          container.style.left = left;
          container.style.width = width;
          container.style.marginLeft = -width.replace("px", "")/2 + "px";
          container.style.zIndex = +options.order + 1000;
          container.classList.add("pop");
          
          target.appendChild( container );


          if( args.style === "icon" ) {
            container.style.width = "";
            container.style.height = "";
            container.classList.add("zoink-icon-" + options.classes);
            return;
          }

          if( typeof args.text === "string" ) {
            _makeBubble( { text: args.text, style: args.style, classes: args.classes } );
          }
          else if ( typeof args.text === "object" ) {
            for(i = 0; i<args.text.length; i++) {

              args.text[i].classes || ( args.text[i].classes = "" );
              //Set the default type to be none instead of speech
              if( args.text[i].style === undefined) {
                args.text[i].style = "none";
              }
              if( i !== args.text.length - 1 ) {
                args.text[i].classes += " pipe";
              }
              _makeBubble( { text: args.text[i].text, style: args.text[i].style, classes: args.text[i].classes + " full-width" } );
            }
          }

          function _makeBubble( bubbleArgs ) {
            var bubble = document.createElement("div"),
                innerText = document.createElement("div"),
                text = bubbleArgs.text || "",
                style = bubbleArgs.style || "speech",
                classes = bubbleArgs.classes || "bottom right",
                textClasses = options.textClasses;

            innerText.innerHTML = text;
            textClasses && ( innerText.className = "text " + textClasses ) || ( innerText.className = "text");
            bubble.appendChild( innerText );
            container.appendChild( bubble );
            _makeTriangle( bubble, { style: style, classes: classes } );
          }

          function _makeTriangle( bubble, args ) {
            !args && ( args = {} );
            args.style || ( args.style = "" );

            var elem,
                triangle,
                pipe,
                ctx,
                classes = args.classes || "bottom right";

            //Check if the input is a string or an actual element
            if (typeof bubble === "string") {
              elem = document.getElementById(bubble);
            } else {
              elem = bubble;
            }

            //Set the base classes
            elem.className =  "speechBubble " + args.style + " " + classes;

            //Speech bubble
            if( args.style === "speech" || args.style === "thought" ){
              
              triangle = document.createElement("canvas");
              ctx = triangle.getContext("2d");

              triangle.width = 40;
              triangle.height = 60;
              triangle.className = "canvas";
              elem.appendChild( triangle );

              //Draw according to the style
              args.style === "speech" && drawSpeech( ctx );
              args.style === "thought" && drawThought( ctx );
            }

            if ( args.style === "didyouknow" || args.style === "fact" || args.style === "fiction" ) {
              addDidYouKnow( args.style );
            }

            //Pipe
            if ( args.classes && args.classes.indexOf("pipe") !== -1 ){
              elem.className +=  " connected pipe";
              pipe = document.createElement("div");
              pipe.className = "pipe";
              elem.appendChild( pipe );
            }

            function addDidYouKnow(style){
              var el = document.createElement("div");

              el.innerHTML = "Did you know?";
              style === "fact" && ( el.innerHTML = "Fact!" );
              style === "fiction" && ( el.innerHTML = "Fiction!" );

              el.classList.add("zoink-didyouknow");
              style && style !== "didyouknow" && el.classList.add( style );
              elem.appendChild( el );
              elem.className += " didyouknow";
            }

            function drawSpeech(ctx) {
              ctx.save();
              ctx.beginPath();
              ctx.moveTo(0.4, 0.3);
              ctx.bezierCurveTo(0.4, 0.3, 17.8, 26.3, 15.1, 41.9);
              ctx.bezierCurveTo(15.1, 41.9, 26.2, 26.3, 23.4, 0.3);
              ctx.fillStyle = "rgb(255, 255, 255)";
              ctx.fill();
              ctx.lineWidth = 2;
              ctx.stroke();
              ctx.restore();
            }

            function drawThought(ctx) {
               // circle1
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(13.5, 7.0);
                ctx.bezierCurveTo(13.5, 10.6, 10.6, 13.5, 7.0, 13.5);
                ctx.bezierCurveTo(3.4, 13.5, 0.5, 10.6, 0.5, 7.0);
                ctx.bezierCurveTo(0.5, 3.4, 3.4, 0.5, 7.0, 0.5);
                ctx.bezierCurveTo(10.6, 0.5, 13.5, 3.4, 13.5, 7.0);
                ctx.closePath();
                ctx.fillStyle = "rgb(255, 255, 255)";
                ctx.fill();
                ctx.lineWidth = 2;
                ctx.stroke();

                // circle2
                ctx.beginPath();
                ctx.moveTo(17.5, 23.8);
                ctx.bezierCurveTo(17.5, 26.1, 15.6, 28.0, 13.2, 28.0);
                ctx.bezierCurveTo(10.9, 28.0, 9.0, 26.1, 9.0, 23.8);
                ctx.bezierCurveTo(9.0, 21.4, 10.9, 19.5, 13.2, 19.5);
                ctx.bezierCurveTo(15.6, 19.5, 17.5, 21.4, 17.5, 23.8);
                ctx.closePath();
                ctx.fill();
                ctx.lineWidth = 2;
                ctx.stroke();

                // circle3
                ctx.beginPath();
                ctx.moveTo(27.5, 31.8);
                ctx.bezierCurveTo(27.5, 33.5, 26.0, 35.0, 24.2, 35.0);
                ctx.bezierCurveTo(22.5, 35.0, 21.0, 33.5, 21.0, 31.8);
                ctx.bezierCurveTo(21.0, 30.0, 22.5, 28.5, 24.2, 28.5);
                ctx.bezierCurveTo(26.0, 28.5, 27.5, 30.0, 27.5, 31.8);
                ctx.closePath();
                ctx.fill();
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.restore();
            }
          }
        } //addSpeechBubble
  
      },
      start: function( event, options ) {
        options._container.classList.add( "on" );
      },
    
      end: function( event, options ) {
        options._container.classList.remove( "on" );
      },
      _teardown: function( options ) {
        if( options._container && options._container.parentNode ) {
          options._container.parentNode.removeChild( options._container );
        }
      }
  });
})( Popcorn );

