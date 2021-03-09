'reach 0.1';

export const main = Reach.App(
  {},
  [
    Participant('Creator', {
      getId: Fun([], UInt)
    }),
    ParticipantClass('Owner', {
      newOwner: Fun([], Address),
      showOwner: Fun([UInt, Address], Null)
    })
  ],
  (Creator, Owner) => {

    // Creator creates the NFT
    Creator.only(() => {
      const id = declassify(interact.getId());
    });
    Creator.publish(id);

    // Since this is a state management app in the shell it will translate to a while loop in the linear Reach code.
    var owner = Creator;
    invariant(balance() == 0);
    while (true) {
      commit();

      Owner.only(() => {
        // If I am the owner, transfer it otherwise I am the receiver
        interact.showOwner(id, owner);
        const amOwner = this == owner;
        const newOwner = amOwner ?
          declassify(interact.newOwner())
          : this;
      });
      Owner.publish(newOwner)
        .when(amOwner)
        .timeout(false);

      // Only the owner can make this assignment
      require(this == owner);
      owner = newOwner;
      continue;
    }

    transfer(balance()).to(Creator);
    commit();

    assert(false);
  }
);
